import React, { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import BottomSheet from '@common/components/BottomSheet'
import Checkbox from '@common/components/Checkbox'
import DualChoiceWarningModal from '@common/components/DualChoiceWarningModal'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { getUiType } from '@common/utils/uiType'

const { isTab } = getUiType()

type Props = {
  sheetRef: React.RefObject<any>
  closeBottomSheet: () => void
  acknowledgeHighPriceImpact: () => void
  highPriceImpactOrSlippageWarning:
    | { type: 'highPriceImpact'; percentageDiff: number }
    | {
        type: 'slippageImpact'
        possibleSlippage: number
        minInUsd: number
        minInToken: string
        symbol: string
      }
    | null
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
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  const closeBottomSheetWrapped = () => {
    closeBottomSheet()
    setIsConfirmed(false)
    setTitle('')
    setDescription('')
  }

  const acknowledgeWarningWrapped = () => {
    acknowledgeHighPriceImpact()
    setIsConfirmed(false)
    setTitle('')
    setDescription('')
  }

  useEffect(() => {
    if (!highPriceImpactOrSlippageWarning) return

    if (highPriceImpactOrSlippageWarning.type === 'highPriceImpact') {
      setTitle(
        t(
          `Ouch! Very high price impact (-${highPriceImpactOrSlippageWarning.percentageDiff.toFixed(
            2
          )}%)`
        )
      )
      setDescription(
        t(
          'This route will significantly affect the market price of this pool and will reduce your expected return.'
        )
      )
    }

    if (highPriceImpactOrSlippageWarning.type === 'slippageImpact') {
      setTitle(
        t(
          `Warning! This route has a higher slippage than usual (${highPriceImpactOrSlippageWarning.possibleSlippage.toFixed(
            2
          )}%)`
        )
      )
      setDescription(
        t(
          `If slippage occurs, you might receive ${highPriceImpactOrSlippageWarning.minInToken} ${
            highPriceImpactOrSlippageWarning.symbol
          } (${highPriceImpactOrSlippageWarning.minInUsd.toFixed(2)}$)`
        )
      )
    }
  }, [title, description, highPriceImpactOrSlippageWarning, t])

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
        primaryButtonProps={{
          disabled: !isConfirmed,
          type: 'dangerFilled'
        }}
        onPrimaryButtonPress={acknowledgeWarningWrapped}
        onSecondaryButtonPress={closeBottomSheetWrapped}
      >
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
      </DualChoiceWarningModal>
    </BottomSheet>
  )
}

export default PriceImpactWarningModal
