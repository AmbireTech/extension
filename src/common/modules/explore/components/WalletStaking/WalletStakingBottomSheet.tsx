import { formatUnits, parseUnits } from 'ethers'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { Modalize } from 'react-native-modalize'

import { STK_WALLET, WALLET_STAKING_ADDR, WALLET_TOKEN } from '@ambire-common/consts/addresses'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import SwapAndBridgeIcon from '@common/assets/svg/SwapAndBridgeIcon'
import BottomSheet from '@common/components/BottomSheet'
import ModalHeader from '@common/components/BottomSheet/ModalHeader'
import Button from '@common/components/Button'
import NumberInput from '@common/components/NumberInput'
import Text from '@common/components/Text'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import { AnimatedPressable } from '@common/hooks/useHover'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'

import { getStakeWalletCalls, getUnstakeWalletCalls } from './calls'
import getStyles from './styles'

const ETHEREUM_CHAIN_ID = 1n
const TOKEN_DECIMALS = 18
const STAKING_HELP_URL = 'https://help.ambire.com/en/collections/18211458-wallet-token-governance'
const PERCENTAGES = [25, 50, 75, 100] as const

type Mode = 'stake' | 'unstake'

const getAmountInWei = (amount: string) => {
  const normalizedAmount = amount.endsWith('.') ? amount.slice(0, -1) : amount
  if (!normalizedAmount) return 0n

  return parseUnits(normalizedAmount, TOKEN_DECIMALS)
}

const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account
const selectPortfolioTokens = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.tokens

interface TabProps {
  mode: Mode
  activeMode: Mode
  label: string
  onSelect: (mode: Mode) => void
}

const StakingTab = ({ mode, activeMode, label, onSelect }: TabProps) => {
  const { styles } = useTheme(getStyles)
  const handlePress = useCallback(() => onSelect(mode), [mode, onSelect])
  const isActive = mode === activeMode

  return (
    <AnimatedPressable onPress={handlePress} style={[styles.tab, isActive && styles.activeTab]}>
      <Text
        fontSize={18}
        weight={isActive ? 'semiBold' : 'medium'}
        appearance={isActive ? 'primaryText' : 'tertiaryText'}
      >
        {label}
      </Text>
    </AnimatedPressable>
  )
}

const MemoizedStakingTab = React.memo(StakingTab)

interface PercentageButtonProps {
  percentage: (typeof PERCENTAGES)[number]
  onSelect: (percentage: number) => void
}

const PercentageButton = ({ percentage, onSelect }: PercentageButtonProps) => {
  const { styles } = useTheme(getStyles)
  const handlePress = useCallback(() => onSelect(percentage), [onSelect, percentage])

  return (
    <Button
      type="secondary"
      size="small"
      text={`${percentage}%`}
      onPress={handlePress}
      hasBottomSpacing={false}
      style={styles.percentageButton}
    />
  )
}

const MemoizedPercentageButton = React.memo(PercentageButton)

interface Props {
  sheetRef: React.RefObject<Modalize>
  closeBottomSheet: () => void
}

const WalletStakingBottomSheet = ({ sheetRef, closeBottomSheet }: Props) => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { addToast } = useToast()
  const { state: account } = useController('SelectedAccountController', selectAccount)
  const { state: portfolioTokens } = useController(
    'SelectedAccountController',
    selectPortfolioTokens
  )
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const { dispatchAndWait: providersDispatchAndWait } = useController('ProvidersController')
  const [mode, setMode] = useState<Mode>('stake')
  const [amount, setAmount] = useState('')
  const [shareValue, setShareValue] = useState<bigint | null>(null)
  const [isLoadingShareValue, setIsLoadingShareValue] = useState(false)
  const shareValueRequestIdRef = useRef(0)

  const walletToken = useMemo(
    () =>
      portfolioTokens.find(
        (token) =>
          token.chainId === ETHEREUM_CHAIN_ID &&
          token.address.toLowerCase() === WALLET_TOKEN.toLowerCase()
      ),
    [portfolioTokens]
  )
  const stkWalletToken = useMemo(
    () =>
      portfolioTokens.find(
        (token) =>
          token.chainId === ETHEREUM_CHAIN_ID &&
          token.address.toLowerCase() === STK_WALLET.toLowerCase()
      ),
    [portfolioTokens]
  )
  const activeToken = mode === 'stake' ? walletToken : stkWalletToken
  const balance = useMemo(() => BigInt(activeToken?.amount || 0n), [activeToken?.amount])
  const price = useMemo(
    () =>
      activeToken?.priceIn.find(({ baseCurrency }) => baseCurrency.toLowerCase() === 'usd')
        ?.price ||
      walletToken?.priceIn.find(({ baseCurrency }) => baseCurrency.toLowerCase() === 'usd')
        ?.price ||
      0,
    [activeToken?.priceIn, walletToken?.priceIn]
  )
  const amountInWei = getAmountInWei(amount)
  const hasInsufficientBalance = amountInWei > balance
  const balanceLabel = useMemo(
    () => formatDecimals(Number(formatUnits(balance, TOKEN_DECIMALS)), 'amount'),
    [balance]
  )
  const amountInUsd = useMemo(
    () => formatDecimals(Number(amount || 0) * price, 'value'),
    [amount, price]
  )
  const tokenSymbol = mode === 'stake' ? '$WALLET' : 'stkWALLET'
  const isSubmitDisabled =
    !account || amountInWei <= 0n || hasInsufficientBalance || isLoadingShareValue

  const loadShareValue = useCallback(async () => {
    if (shareValue || isLoadingShareValue) return

    const requestId = ++shareValueRequestIdRef.current
    setIsLoadingShareValue(true)
    try {
      const nextShareValue = await providersDispatchAndWait<'callContractAndSendResToUi', bigint>({
        type: 'method',
        params: {
          method: 'callContractAndSendResToUi',
          args: [
            {
              chainId: ETHEREUM_CHAIN_ID,
              address: WALLET_STAKING_ADDR,
              abi: 'function shareValue() view returns (uint256)',
              method: 'shareValue',
              args: []
            }
          ]
        }
      })
      if (requestId === shareValueRequestIdRef.current) {
        setShareValue(BigInt(nextShareValue))
      }
    } catch (error) {
      if (requestId !== shareValueRequestIdRef.current) return

      console.error('Failed to load WALLET staking share value', error)
      captureException(error)
      addToast(t("We couldn't load the unstaking details. Please try again."), { type: 'error' })
    } finally {
      if (requestId === shareValueRequestIdRef.current) setIsLoadingShareValue(false)
    }
  }, [addToast, isLoadingShareValue, providersDispatchAndWait, shareValue, t])

  const handleSelectMode = useCallback(
    (nextMode: Mode) => {
      setMode(nextMode)
      setAmount('')
      if (nextMode === 'unstake') void loadShareValue()
    },
    [loadShareValue]
  )

  const handleSelectPercentage = useCallback(
    (percentage: number) => {
      const nextAmount = (balance * BigInt(percentage)) / 100n
      setAmount(formatUnits(nextAmount, TOKEN_DECIMALS))
    },
    [balance]
  )

  const handleOpenHelp = useCallback(() => {
    openInTab({ url: STAKING_HELP_URL }).catch((error) => {
      console.error('Failed to open WALLET staking help', error)
      captureException(error)
      addToast(t("We couldn't open the staking guide."), { type: 'error' })
    })
  }, [addToast, t])

  const handleSubmit = useCallback(() => {
    if (!account || amountInWei <= 0n || hasInsufficientBalance) return

    if (mode === 'unstake' && !shareValue) {
      addToast(t("We couldn't load the unstaking details. Please try again."), { type: 'error' })
      void loadShareValue()
      return
    }

    const calls =
      mode === 'stake'
        ? getStakeWalletCalls(amountInWei)
        : getUnstakeWalletCalls(amountInWei, shareValue!)

    closeBottomSheet()
    requestsDispatch({
      type: 'method',
      params: {
        method: 'build',
        args: [
          {
            type: 'calls',
            params: {
              executionType: 'open-request-window',
              userRequestParams: {
                calls,
                meta: {
                  accountAddr: account.addr,
                  chainId: ETHEREUM_CHAIN_ID
                }
              }
            }
          }
        ]
      }
    })
  }, [
    account,
    addToast,
    amountInWei,
    closeBottomSheet,
    hasInsufficientBalance,
    loadShareValue,
    mode,
    requestsDispatch,
    shareValue,
    t
  ])

  const handleClosed = useCallback(() => {
    shareValueRequestIdRef.current += 1
    setMode('stake')
    setAmount('')
    setShareValue(null)
    setIsLoadingShareValue(false)
  }, [])

  const headerComponent = useMemo(
    () => (
      <ModalHeader
        handleClose={closeBottomSheet}
        title={t('$WALLET Staking')}
        forceBackButtonOnMobile
      />
    ),
    [closeBottomSheet, t]
  )

  return (
    <BottomSheet
      id="wallet-staking"
      sheetRef={sheetRef}
      closeBottomSheet={closeBottomSheet}
      onClosed={handleClosed}
      HeaderComponent={headerComponent}
      containerInnerWrapperStyles={styles.sheetContent}
    >
      <View>
        <View style={styles.learnMore}>
          <Text fontSize={12} appearance="secondaryText">
            {t('Learn more about')}{' '}
          </Text>
          <AnimatedPressable onPress={handleOpenHelp}>
            <Text
              fontSize={12}
              color={theme.primaryAccent200}
              style={{ textDecorationLine: 'underline' }}
            >
              {t('how staking works')}
            </Text>
          </AnimatedPressable>
        </View>

        <View style={styles.tabs}>
          <MemoizedStakingTab
            mode="stake"
            activeMode={mode}
            label={t('Stake')}
            onSelect={handleSelectMode}
          />
          <MemoizedStakingTab
            mode="unstake"
            activeMode={mode}
            label={t('Unstake')}
            onSelect={handleSelectMode}
          />
        </View>

        <View style={styles.amountCard}>
          <View style={styles.balanceRow}>
            <View style={[flexbox.directionRow, flexbox.alignCenter]}>
              <SwapAndBridgeIcon
                width={14}
                height={14}
                color={theme.primaryAccent200}
                strokeWidth={1.8}
              />
              <Text fontSize={12} appearance="secondaryText" style={spacings.mlTy}>
                {amountInUsd}
              </Text>
            </View>
            <Text fontSize={12} appearance="secondaryText">
              {t('Balance: {{balance}}', { balance: balanceLabel })}
            </Text>
          </View>

          <NumberInput
            value={amount}
            onChangeText={setAmount}
            precision={TOKEN_DECIMALS}
            placeholder="0.00"
            borderless
            containerStyle={styles.amountInput}
            inputWrapperStyle={styles.amountInputWrapper}
            nativeInputStyle={styles.amountNativeInput}
            childrenBeforeButtons={
              <Text fontSize={13} appearance="secondaryText" style={spacings.mlSm}>
                {tokenSymbol}
              </Text>
            }
          />

          <View style={styles.percentages}>
            {PERCENTAGES.map((percentage) => (
              <MemoizedPercentageButton
                key={percentage}
                percentage={percentage}
                onSelect={handleSelectPercentage}
              />
            ))}
          </View>
        </View>

        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text fontSize={13} appearance="secondaryText">
              {t('APY')}
            </Text>
            <Text fontSize={13} appearance="secondaryText">
              {t('2%')}
            </Text>
          </View>
          {mode === 'unstake' && (
            <View style={styles.detailRow}>
              <Text fontSize={13} appearance="secondaryText">
                {t('Lock')}
              </Text>
              <Text fontSize={13} appearance="secondaryText">
                {t('30 days unbond period')}
              </Text>
            </View>
          )}
          <Text fontSize={11} appearance="errorText" style={styles.validation}>
            {hasInsufficientBalance ? t('The amount is higher than your balance.') : ''}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button
          type="secondary"
          text={t('Cancel')}
          onPress={closeBottomSheet}
          hasBottomSpacing={false}
          style={styles.footerButton}
        />
        <Button
          type="primary"
          text={mode === 'stake' ? t('Stake') : t('Unstake')}
          onPress={handleSubmit}
          disabled={isSubmitDisabled || (mode === 'unstake' && !shareValue)}
          hasBottomSpacing={false}
          style={styles.footerButton}
        />
      </View>
    </BottomSheet>
  )
}

export default React.memo(WalletStakingBottomSheet)
