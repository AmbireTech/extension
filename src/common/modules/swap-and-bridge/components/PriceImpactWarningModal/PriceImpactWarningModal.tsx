import type { TFunction } from 'i18next'
import React, { FC, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getExtremeSwapConfirmationPhrase } from '@ambire-common/libs/safeguards/extremeSwapLoss'
import { SwapAmountWarning } from '@ambire-common/consts/safeguards/swapAmountWarnings'
import BottomSheet from '@common/components/BottomSheet'
import Checkbox from '@common/components/Checkbox'
import DualChoiceWarningModal from '@common/components/DualChoiceWarningModal'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

import ExtremeSwapConfirmationField from './ExtremeSwapConfirmationField'

const { isTab } = getUiType()

type Props = {
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
  acknowledgeHighPriceImpact: () => void
  highPriceImpactOrSlippageWarning: SwapAmountWarning | null
}

const getWarningCopy = (warning: SwapAmountWarning, isExtreme: boolean, t: TFunction) => {
  if (warning.type === 'highPriceImpact') {
    return {
      title: isExtreme
        ? t('Critical loss warning (-{{percentageDiff}}%)', {
            percentageDiff: warning.percentageDiff.toFixed(2)
          })
        : t(`Ouch! Very high price impact (-${warning.percentageDiff.toFixed(2)}%)`),
      description: isExtreme
        ? t(
            'This trade is expected to lose about {{estimatedLossUsd}} USD compared to what you send. Type the confirmation phrase below to continue.',
            {
              estimatedLossUsd: Math.floor(warning.estimatedLossUsd).toLocaleString()
            }
          )
        : t(
            'This route will significantly affect the market price of this pool and will reduce your expected return.'
          )
    }
  }

  return {
    title: isExtreme
      ? t('Critical slippage warning ({{possibleSlippage}}%)', {
          possibleSlippage: warning.possibleSlippage.toFixed(2)
        })
      : t(
          `Warning! This route has a higher slippage than usual (${warning.possibleSlippage.toFixed(2)}%)`
        ),
    description: isExtreme
      ? t(
          'If slippage occurs, you could lose about {{estimatedLossUsd}} USD and receive as little as {{minInToken}} {{symbol}} ({{minInUsd}}$). Type the confirmation phrase below to continue.',
          {
            estimatedLossUsd: Math.floor(warning.estimatedLossUsd).toLocaleString(),
            minInToken: warning.minInToken,
            symbol: warning.symbol,
            minInUsd: warning.minInUsd.toFixed(2)
          }
        )
      : t(
          `If slippage occurs, you might receive ${warning.minInToken} ${warning.symbol} (${warning.minInUsd.toFixed(2)}$)`
        )
  }
}

const PriceImpactWarningModal: FC<Props> = ({
  sheetRef,
  closeBottomSheet,
  acknowledgeHighPriceImpact,
  highPriceImpactOrSlippageWarning
}) => {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [isExtremePhraseValid, setIsExtremePhraseValid] = useState(false)

  const warning = highPriceImpactOrSlippageWarning
  const isExtreme = warning?.severity === 'extreme'

  const expectedConfirmationPhrase = useMemo(() => {
    if (!isExtreme || !warning) return ''

    return getExtremeSwapConfirmationPhrase(warning.estimatedLossUsd)
  }, [isExtreme, warning])

  const { title, description } = useMemo(() => {
    if (!warning) return { title: '', description: '' }

    return getWarningCopy(warning, isExtreme, t)
  }, [isExtreme, t, warning])

  const isConfirmationValid = isExtreme ? isExtremePhraseValid : isConfirmed

  const handleExtremePhraseValidationChange = useCallback((isValid: boolean) => {
    setIsExtremePhraseValid((prev) => (prev === isValid ? prev : isValid))
  }, [])

  const resetModalState = useCallback(() => {
    setIsConfirmed(false)
    setIsExtremePhraseValid(false)
  }, [])

  const closeBottomSheetWrapped = useCallback(() => {
    closeBottomSheet()
    resetModalState()
  }, [closeBottomSheet, resetModalState])

  const acknowledgeWarningWrapped = useCallback(() => {
    acknowledgeHighPriceImpact()
    resetModalState()
  }, [acknowledgeHighPriceImpact, resetModalState])

  const primaryButtonProps = useMemo(
    () => ({
      disabled: !isConfirmationValid,
      type: 'dangerFilled' as const
    }),
    [isConfirmationValid]
  )

  if (!warning) return null

  return (
    <BottomSheet
      id="warning-modal"
      closeBottomSheet={closeBottomSheetWrapped}
      sheetRef={sheetRef}
      type={isTab ? 'modal' : 'bottom-sheet'}
      withBackdropBlur={false}
      shouldBeClosableOnDrag={false}
    >
      <DualChoiceWarningModal
        title={title}
        type="error"
        description={description}
        primaryButtonText={t('Continue anyway')}
        secondaryButtonText={t('Cancel')}
        primaryButtonProps={primaryButtonProps}
        onPrimaryButtonPress={acknowledgeWarningWrapped}
        onSecondaryButtonPress={closeBottomSheetWrapped}
      >
        {isExtreme ? (
          <ExtremeSwapConfirmationField
            expectedConfirmationPhrase={expectedConfirmationPhrase}
            onValidationChange={handleExtremePhraseValidationChange}
          />
        ) : (
          <Checkbox
            label={t('I understand ')}
            value={isConfirmed}
            labelProps={{
              fontSize: 16,
              weight: 'medium',
              color: theme.errorText
            }}
            uncheckedBorderColor={theme.errorDecorative}
            checkedColor={theme.errorDecorative}
            onValueChange={setIsConfirmed}
            style={{ ...spacings.mtLg, ...flexbox.alignCenter }}
          />
        )}
      </DualChoiceWarningModal>
    </BottomSheet>
  )
}

export default PriceImpactWarningModal
