import React from 'react'
import { View } from 'react-native'

import { STK_WALLET, WALLET_TOKEN } from '@ambire-common/consts/addresses'
import { ETHEREUM_CHAIN_ID } from '@ambire-common/consts/networks'
import FlipIcon from '@common/assets/svg/FlipIcon'
import AmountInput from '@common/components/AmountInput'
import AmountSlider from '@common/components/AmountSlider'
import HoverablePressable from '@common/components/HoverablePressable'
import MaxButton from '@common/components/MaxButton'
import Text from '@common/components/Text'
import TokenIcon from '@common/components/TokenIcon'
import { isMobile } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import BalanceLabel from '@common/modules/wallet-staking/components/BalanceLabel'
import BalanceRatioProgress from '@common/modules/wallet-staking/components/BalanceRatioProgress'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import getStyles from './styles'

import type { WalletStakingFormState } from '@common/modules/wallet-staking/hooks/useWalletStakingForm'

const FIAT_DECIMALS = 2
const TOKEN_DECIMALS = 18

interface Props {
  form: WalletStakingFormState
}

/** The amount field: the balance, the fixed token next to the token/USD input, and the tiered slider with the Max button. */
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
  const tokenAddress = mode === 'stake' ? WALLET_TOKEN : STK_WALLET

  return (
    <View style={styles.amountCard}>
      <View style={styles.balanceRow}>
        <BalanceLabel balanceLabel={balanceLabel} tokenSymbol={tokenSymbol} />
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

      <View style={styles.tokenRow}>
        {/* Laid out like the swap screen's token select, but the token is fixed by the mode */}
        <View style={styles.token}>
          <TokenIcon
            containerHeight={28}
            containerWidth={28}
            width={24}
            height={24}
            networkSize={12}
            withContainer
            withNetworkIcon
            address={tokenAddress}
            chainId={ETHEREUM_CHAIN_ID}
          />
          <View style={styles.tokenLabel}>
            <Text fontSize={isMobile ? 14 : 16} weight="semiBold" numberOfLines={1}>
              {tokenSymbol}
            </Text>
            <Text fontSize={12} appearance="secondaryText" numberOfLines={1}>
              {t('on Ethereum')}
            </Text>
          </View>
        </View>
        <View style={styles.amountColumn}>
          <AmountInput
            type={amountFieldMode}
            value={amountFieldMode === 'fiat' ? fiatAmount : amount}
            onChangeText={amountFieldMode === 'fiat' ? onFiatAmountChange : onTokenAmountChange}
            precision={amountFieldMode === 'fiat' ? FIAT_DECIMALS : TOKEN_DECIMALS}
            inputTestId="wallet-staking-amount-input"
            // A wrapper style of its own lets the input fill the column instead of hugging its value
            inputWrapperStyle={styles.amountInputWrapper}
            textAlign="right"
            // Matches the amount the swap screen's You send panel renders
            fontSize={20}
          />
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
      </View>

      <View style={styles.sliderRow}>
        <View style={flexbox.flex1}>
          <AmountSlider
            value={amountInWei}
            maximumValue={balance}
            onValueChange={onSliderValueChange}
            tierOffset={mode === 'stake' ? stkWalletBalance : 0n}
            marks={sliderTierMarks}
          />
        </View>
        <MaxButton
          onPress={onMaxPress}
          disabled={balance <= 0n}
          testID="wallet-staking-max-button"
          style={styles.maxButton}
        />
      </View>
    </View>
  )
}

export default React.memo(StakingAmountCard)
