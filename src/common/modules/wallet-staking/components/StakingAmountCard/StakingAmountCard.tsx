import React from 'react'
import { View } from 'react-native'

import FlipIcon from '@common/assets/svg/FlipIcon'
import AmountSlider from '@common/components/AmountSlider'
import HoverablePressable from '@common/components/HoverablePressable'
import NumberInput from '@common/components/NumberInput'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import BalanceRatioProgress from '@common/modules/wallet-staking/components/BalanceRatioProgress'
import BalanceWithMax from '@common/modules/wallet-staking/components/BalanceWithMax'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

import type { WalletStakingFormState } from '@common/modules/wallet-staking/hooks/useWalletStakingForm'

const FIAT_DECIMALS = 2
const TOKEN_DECIMALS = 18

interface Props {
  form: WalletStakingFormState
}

/** The amount field: the balance and Max button, the token/USD input and the tiered slider. */
const StakingAmountCard = ({ form }: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const {
    mode,
    amount,
    fiatAmount,
    amountFieldMode,
    amountInUsd,
    amountInToken,
    amountInWei,
    balance,
    balanceLabel,
    tokenSymbol,
    stkWalletBalance,
    sliderTierMarks,
    balanceRatioSegments,
    shouldShowBalanceRatioProgress,
    isAmountFieldModeSwitchDisabled,
    onTokenAmountChange,
    onFiatAmountChange,
    switchAmountFieldMode,
    onMaxPress,
    onSliderValueChange
  } = form

  return (
    <View style={styles.amountCard}>
      <View style={styles.balanceRow}>
        <BalanceWithMax
          balanceLabel={balanceLabel}
          tokenSymbol={tokenSymbol}
          disabled={balance <= 0n}
          onMaxPress={onMaxPress}
          testID="wallet-staking-max-button"
        />
        <View style={styles.switchAmountFieldMode}>
          <HoverablePressable
            onPress={switchAmountFieldMode}
            disabled={isAmountFieldModeSwitchDisabled}
            accessibilityLabel={t('Switch between token and USD amount')}
            testID="wallet-staking-switch-amount-field-mode"
          >
            <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.justifyEnd]}>
              <Text
                fontSize={12}
                appearance="secondaryText"
                numberOfLines={1}
                weight="medium"
                ellipsizeMode="tail"
                style={styles.switchAmountFieldModeValue}
              >
                {amountFieldMode === 'token' ? amountInUsd : amountInToken}
              </Text>
              <View style={styles.switchAmountFieldModeIcon}>
                <FlipIcon width={11} height={11} color={theme.primary} />
              </View>
            </View>
          </HoverablePressable>
        </View>
      </View>

      <NumberInput
        value={amountFieldMode === 'fiat' ? fiatAmount : amount}
        onChangeText={amountFieldMode === 'fiat' ? onFiatAmountChange : onTokenAmountChange}
        precision={amountFieldMode === 'fiat' ? FIAT_DECIMALS : TOKEN_DECIMALS}
        placeholder="0.00"
        borderless
        containerStyle={styles.amountInput}
        inputWrapperStyle={styles.amountInputWrapper}
        nativeInputStyle={styles.amountNativeInput}
        childrenBeforeButtons={
          <View style={[flexbox.directionRow, flexbox.alignCenter]}>
            <Text fontSize={13} appearance="secondaryText" style={spacings.mlSm}>
              {amountFieldMode === 'fiat' ? t('USD') : tokenSymbol}
            </Text>
            {shouldShowBalanceRatioProgress && (
              <View style={spacings.mlSm}>
                <BalanceRatioProgress
                  segments={balanceRatioSegments}
                  testID="wallet-staking-balance-ratio"
                  size={28}
                  strokeWidth={4}
                />
              </View>
            )}
          </View>
        }
      />

      <AmountSlider
        value={amountInWei}
        maximumValue={balance}
        onValueChange={onSliderValueChange}
        tierOffset={mode === 'stake' ? stkWalletBalance : 0n}
        marks={sliderTierMarks}
      />
    </View>
  )
}

export default React.memo(StakingAmountCard)
