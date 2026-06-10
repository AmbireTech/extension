import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { getFeeSpeedIdentifier } from '@ambire-common/controllers/signAccountOp/helper'
import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import DualChoiceWarningModal from '@common/components/DualChoiceWarningModal'
import Text from '@common/components/Text'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

type Props = {
  signAccountOpState: ISignAccountOpController
  onAccept: () => void
  onCancel: () => void
}

const GasFeeUpdatedModal = ({ signAccountOpState, onAccept, onCancel }: Props) => {
  const { t } = useTranslation()

  const updatedFeeLabel = useMemo(() => {
    if (!signAccountOpState.selectedOption || !signAccountOpState.selectedFeeSpeed) return null

    const identifier = getFeeSpeedIdentifier(
      signAccountOpState.selectedOption,
      signAccountOpState.accountOp.accountAddr
    )
    const selectedSpeed = signAccountOpState.feeSpeeds[identifier]?.find(
      (speed) => speed.type === signAccountOpState.selectedFeeSpeed
    )

    if (!selectedSpeed) return null

    const feeTokenPriceUnavailableWarning = signAccountOpState.warnings.find(
      (warning) => warning.id === 'feeTokenPriceUnavailable'
    )
    const tokenSymbol = signAccountOpState.selectedOption.token.symbol

    if (feeTokenPriceUnavailableWarning) {
      return `${formatDecimals(Number(selectedSpeed.amountFormatted), 'precise')} ${tokenSymbol}`
    }

    return formatDecimals(Number(selectedSpeed.amountUsd), 'value')
  }, [signAccountOpState])

  return (
    <DualChoiceWarningModal
      title={t('Gas fee updated')}
      description={t(
        'Network fee changed significantly while preparing the transaction. The fee has been updated.'
      )}
      primaryButtonText={t('Accept and continue')}
      secondaryButtonText={t('Cancel')}
      onPrimaryButtonPress={onAccept}
      onSecondaryButtonPress={onCancel}
      type="info"
    >
      {updatedFeeLabel ? (
        <View style={[flexbox.directionRow, flexbox.justifySpaceBetween, spacings.mb3Xl]}>
          <Text fontSize={16} appearance="secondaryText">
            {t('Updated fee')}
          </Text>
          <Text fontSize={16} weight="medium">
            {updatedFeeLabel}
          </Text>
        </View>
      ) : null}
    </DualChoiceWarningModal>
  )
}

export default React.memo(GasFeeUpdatedModal)
