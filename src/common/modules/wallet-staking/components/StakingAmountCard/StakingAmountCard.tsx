import { formatUnits } from 'ethers'
import React, { useMemo } from 'react'

import { STK_WALLET, WALLET_TOKEN } from '@ambire-common/consts/addresses'
import { ETHEREUM_CHAIN_ID } from '@ambire-common/consts/networks'
import TokenAndAmountSelector from '@common/components/TokenAndAmountSelector'
import FixedToken from '@common/components/FixedToken'
import { useTranslation } from '@common/config/localization'
import BalanceRatioProgress from '@common/modules/wallet-staking/components/BalanceRatioProgress'

import type { WalletStakingFormState } from '@common/modules/wallet-staking/hooks/useWalletStakingForm'

const FIAT_DECIMALS = 2
const TOKEN_DECIMALS = 18

const TEST_IDS = {
  amount: 'wallet-staking-amount-input',
  amountFieldModeSwitch: 'wallet-staking-switch-amount-field-mode',
  maxButton: 'wallet-staking-max-button'
}

interface Props {
  form: WalletStakingFormState
}

/** The amount field: the balance, the fixed token next to the token/USD input, and the tiered slider with the Max button. */
const StakingAmountCard = ({ form }: Props) => {
  const { t } = useTranslation()
  const {
    mode,
    amount,
    fiatAmount,
    amountFieldMode,
    amountInUsd,
    amountInToken,
    amountInWei,
    balance,
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
    onSliderValueChange,
    hasInsufficientBalance,
    hasZeroAmount
  } = form

  const balanceSummary = useMemo(
    () => ({ amount: Number(formatUnits(balance, TOKEN_DECIMALS)), symbol: tokenSymbol }),
    [balance, tokenSymbol]
  )

  const amountFieldModeSwitch = useMemo(
    () => ({
      label: amountFieldMode === 'token' ? amountInUsd : amountInToken,
      onPress: switchAmountFieldMode,
      disabled: isAmountFieldModeSwitchDisabled
    }),
    [
      amountFieldMode,
      amountInUsd,
      amountInToken,
      switchAmountFieldMode,
      isAmountFieldModeSwitchDisabled
    ]
  )

  const slider = useMemo(
    () => ({
      value: amountInWei,
      maximumValue: balance,
      onValueChange: onSliderValueChange,
      tierOffset: mode === 'stake' ? stkWalletBalance : 0n,
      marks: sliderTierMarks
    }),
    [amountInWei, balance, onSliderValueChange, mode, stkWalletBalance, sliderTierMarks]
  )

  const errorText = hasInsufficientBalance
    ? t('The amount is higher than your balance.')
    : hasZeroAmount
      ? t('The amount must be greater than 0.')
      : ''
  const message = useMemo(() => ({ text: errorText, severity: 'error' as const }), [errorText])

  return (
    <TokenAndAmountSelector
      token={
        <FixedToken
          address={mode === 'stake' ? WALLET_TOKEN : STK_WALLET}
          chainId={ETHEREUM_CHAIN_ID}
          symbol={tokenSymbol}
          subtitle={t('on Ethereum')}
        />
      }
      balance={balanceSummary}
      amountFieldModeSwitch={amountFieldModeSwitch}
      amountFieldMode={amountFieldMode}
      amount={amountFieldMode === 'fiat' ? fiatAmount : amount}
      onAmountChange={amountFieldMode === 'fiat' ? onFiatAmountChange : onTokenAmountChange}
      precision={amountFieldMode === 'fiat' ? FIAT_DECIMALS : TOKEN_DECIMALS}
      amountAccessory={
        shouldShowBalanceRatioProgress && (
          <BalanceRatioProgress
            segments={balanceRatioSegments}
            testID="wallet-staking-balance-ratio"
            size={28}
            strokeWidth={4}
          />
        )
      }
      // There's a single token here, so it gets no more of the row than the amount does
      isTokenRowSplitEvenly
      slider={slider}
      onMaxPress={onMaxPress}
      isMaxDisabled={balance <= 0n}
      message={message}
      testIDs={TEST_IDS}
    />
  )
}

export default React.memo(StakingAmountCard)
