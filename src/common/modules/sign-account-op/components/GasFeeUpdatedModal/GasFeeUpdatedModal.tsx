import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { getFeeSpeedIdentifier } from '@ambire-common/controllers/signAccountOp/helper'
import { SpeedCalc } from '@ambire-common/interfaces/signAccountOp'
import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import { canFeeOptionCoverAmount } from '@ambire-common/libs/account/feeOptions'
import { TokenResult } from '@ambire-common/libs/portfolio'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import GasTankIcon from '@common/assets/svg/GasTankIcon'
import RightArrowIcon from '@common/assets/svg/RightArrowIcon'
import DualChoiceWarningModal from '@common/components/DualChoiceWarningModal'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

type Props = {
  signAccountOpState: ISignAccountOpController
  onAccept: () => void
  onCancel: () => void
}

type FeeValueProps = {
  fee: SpeedCalc
  token: TokenResult
}

const FeeValue = React.memo(({ fee, token }: FeeValueProps) => {
  const { styles, theme } = useTheme(getStyles)

  return (
    <View style={[flexbox.directionRow, flexbox.alignCenter]}>
      {token.flags.onGasTank ? (
        <View style={styles.gasTankIconWrapper}>
          <GasTankIcon color={theme.primaryAccent300} width={20} height={20} />
        </View>
      ) : (
        <TokenIcon
          containerStyle={styles.tokenIconContainer}
          withContainer
          width={28}
          height={28}
          networkSize={14}
          address={token.address}
          chainId={token.chainId}
          onGasTank={token.flags.onGasTank}
          skeletonAppearance="secondaryBackground"
        />
      )}
      <View style={spacings.mlTy}>
        <Text fontSize={14} weight="semiBold">
          {formatDecimals(Number(fee.amountFormatted), 'amount')} {token.symbol}
        </Text>
        <Text appearance="secondaryText" fontSize={12} weight="medium">
          {formatDecimals(Number(fee.amountUsd), 'value')}
        </Text>
      </View>
    </View>
  )
})

const GasFeeUpdatedModal = ({ signAccountOpState, onAccept, onCancel }: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)

  const updatedFee = useMemo(() => {
    if (!signAccountOpState.selectedOption || !signAccountOpState.selectedFeeSpeed) return null

    const identifier = getFeeSpeedIdentifier(
      signAccountOpState.selectedOption,
      signAccountOpState.accountOp.accountAddr
    )
    const selectedSpeed = signAccountOpState.feeSpeeds[identifier]?.find(
      (speed) => speed.type === signAccountOpState.selectedFeeSpeed
    )

    return selectedSpeed || null
  }, [signAccountOpState])

  const token = signAccountOpState.selectedOption?.token
  const hasEnoughFunds = useMemo(() => {
    if (!updatedFee || !signAccountOpState.selectedOption) return true

    return canFeeOptionCoverAmount(
      signAccountOpState.selectedOption,
      signAccountOpState.accountOp,
      updatedFee.amount
    )
  }, [signAccountOpState.accountOp, signAccountOpState.selectedOption, updatedFee])

  return (
    <DualChoiceWarningModal
      title={hasEnoughFunds ? t('Gas fee updated') : t('Insufficient funds')}
      description={t('Network fee changed significantly while preparing the transaction')}
      primaryButtonText={t('Accept and continue')}
      secondaryButtonText={t('Cancel')}
      onPrimaryButtonPress={onAccept}
      onSecondaryButtonPress={onCancel}
      type={hasEnoughFunds ? 'info' : 'error'}
      primaryButtonProps={{ disabled: !hasEnoughFunds }}
      contentStyle={spacings.pt}
      descriptionStyle={spacings.mbLg}
    >
      {signAccountOpState.previousFee && updatedFee && token ? (
        <View style={flexbox.alignCenter}>
          <View style={[flexbox.directionRow, flexbox.alignCenter, spacings.mbTy]}>
            <Text
              fontSize={16}
              appearance="secondaryText"
              style={[flexbox.flex1, { minWidth: 100 }]}
            >
              {t('Previous fee')}
            </Text>
            <View style={styles.arrowColumn} />
            <Text
              fontSize={16}
              appearance="secondaryText"
              style={[flexbox.flex1, { minWidth: 100 }]}
            >
              {t('Updated fee')}
            </Text>
          </View>
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <View style={flexbox.flex1}>
              <FeeValue fee={signAccountOpState.previousFee} token={token} />
            </View>
            <View style={[styles.arrowColumn, flexbox.center]}>
              <RightArrowIcon color={theme.secondaryText} width={8} height={15} weight="1.5" />
            </View>
            <View style={[flexbox.flex1]}>
              <FeeValue fee={updatedFee} token={token} />
            </View>
          </View>
        </View>
      ) : null}
    </DualChoiceWarningModal>
  )
}

export default React.memo(GasFeeUpdatedModal)
