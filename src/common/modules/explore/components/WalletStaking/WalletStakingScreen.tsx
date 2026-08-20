import { formatUnits, parseUnits } from 'ethers'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'

import { STK_WALLET, WALLET_TOKEN } from '@ambire-common/consts/addresses'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import InfoIcon from '@common/assets/svg/InfoIcon'
import SwapAndBridgeIcon from '@common/assets/svg/SwapAndBridgeIcon'
import Button from '@common/components/Button'
import GlassView from '@common/components/GlassView'
import HoverablePressable from '@common/components/HoverablePressable'
import LayoutWrapper from '@common/components/LayoutWrapper'
import NumberInput from '@common/components/NumberInput'
import Text from '@common/components/Text'
import Tooltip from '@common/components/Tooltip'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import { AnimatedPressable } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { WALLET_STAKING_ROUTE_STORAGE_KEY } from '@common/modules/explore/constants/walletStaking'
import Header from '@common/modules/header/components/Header/Header'
import { ROUTES } from '@common/modules/router/constants/common'
import { storage } from '@common/services/storage'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'

import { getStakeWalletCalls, getUnstakeWalletCalls } from './calls'
import getStyles from './styles'

const ETHEREUM_CHAIN_ID = 1n
const TOKEN_DECIMALS = 18
const EMPTY_STATE_BALANCE_THRESHOLD = parseUnits('0.001', TOKEN_DECIMALS)
const STAKING_HELP_URL = 'https://help.ambire.com/en/collections/18211458-wallet-token-governance'
const STAKING_APY_PROPOSAL_URL =
  'https://snapshot.org/#/s:ambire.eth/proposal/0xfc8edfdf451b2aa25575ea198019572de9dd0cdc1949d83e2176c75b62d6c913'
const STAKING_APY_TOOLTIP_ID = 'wallet-staking-apy-tooltip'
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
const selectIsPortfolioReady = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.isReadyToVisualize

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

const WalletStakingScreen = () => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { navigate } = useNavigation()
  const { params } = useRoute()
  const { addToast } = useToast()
  const { state: account } = useController('SelectedAccountController', selectAccount)
  const { state: portfolioTokens } = useController(
    'SelectedAccountController',
    selectPortfolioTokens
  )
  const { state: isPortfolioReady } = useController(
    'SelectedAccountController',
    selectIsPortfolioReady
  )
  const { dispatch: requestsDispatch } = useController('RequestsController')
  const { dispatchAndWait: providersDispatchAndWait } = useController('ProvidersController')
  const [mode, setMode] = useState<Mode>('stake')
  const [amount, setAmount] = useState('')
  const [shareValue, setShareValue] = useState<bigint | null>(null)
  const [isLoadingShareValue, setIsLoadingShareValue] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasMadeRequest, setHasMadeRequest] = useState(false)
  const shareValueRequestIdRef = useRef(0)
  const shouldPersistStakingRouteRef = useRef(false)

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
  const walletBalance = useMemo(() => BigInt(walletToken?.amount || 0n), [walletToken?.amount])
  const stkWalletBalance = useMemo(
    () => BigInt(stkWalletToken?.amount || 0n),
    [stkWalletToken?.amount]
  )
  const shouldShowEmptyState =
    isPortfolioReady &&
    walletBalance < EMPTY_STATE_BALANCE_THRESHOLD &&
    stkWalletBalance < EMPTY_STATE_BALANCE_THRESHOLD
  const activeToken = mode === 'stake' ? walletToken : stkWalletToken
  const balance = mode === 'stake' ? walletBalance : stkWalletBalance
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
    !account || amountInWei <= 0n || hasInsufficientBalance || isLoadingShareValue || isSubmitting
  const submitButtonText = isSubmitting
    ? mode === 'stake'
      ? t('Staking...')
      : t('Unstaking...')
    : mode === 'stake'
      ? t('Stake')
      : t('Unstake')
  const shouldPersistStakingRoute = Boolean(amount.trim()) && !hasMadeRequest

  const loadShareValue = useCallback(async () => {
    if (shareValue || isLoadingShareValue) return

    const requestId = ++shareValueRequestIdRef.current
    setIsLoadingShareValue(true)
    try {
      const nextShareValue = await providersDispatchAndWait<
        'getXWalletShareValueAndSendResToUi',
        bigint
      >({
        type: 'method',
        params: {
          method: 'getXWalletShareValueAndSendResToUi',
          args: []
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
      setIsSubmitting(false)
      shouldPersistStakingRouteRef.current = false
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

  const handleOpenStakingApyProposal = useCallback(() => {
    openInTab({ url: STAKING_APY_PROPOSAL_URL }).catch((error) => {
      console.error('Failed to open the WALLET staking APY proposal', error)
      captureException(error)
      addToast(t("We couldn't open the DAO vote."), { type: 'error' })
    })
  }, [addToast, t])

  const stakingApyTooltipContent = useMemo(
    () => (
      <View style={[flexbox.directionRow, flexbox.alignCenter, flexbox.wrap]}>
        <Text fontSize={14} appearance="secondaryText">
          {t('Currently')}{' '}
        </Text>
        <HoverablePressable onPress={handleOpenStakingApyProposal}>
          <Text fontSize={14} weight="medium" appearance="primary">
            {t('voted by the DAO')}
          </Text>
        </HoverablePressable>
        <Text fontSize={14} appearance="secondaryText">
          {' '}
          {t('as a fair staking incentive')}
        </Text>
      </View>
    ),
    [handleOpenStakingApyProposal, t]
  )

  const handleBuyWallet = useCallback(() => {
    navigate(ROUTES.swapAndBridge, {
      state: {
        preselectedToToken: {
          address: WALLET_TOKEN,
          chainId: ETHEREUM_CHAIN_ID
        }
      }
    })
  }, [navigate])

  const handleBack = useCallback(async () => {
    setIsSubmitting(false)

    if (isWeb) {
      try {
        await storage.remove(WALLET_STAKING_ROUTE_STORAGE_KEY)
      } catch (error) {
        console.error('Failed to clear the WALLET staking route', error)
        captureException(error)
        addToast(t("We couldn't leave the staking page. Please try again."), { type: 'error' })
        return
      }
    }

    const previousPath = params?.prevRoute?.pathname
    if (previousPath && previousPath !== '/') {
      navigate(-1)
      return
    }

    navigate(ROUTES.explore, { replace: true })
  }, [addToast, navigate, params?.prevRoute?.pathname, t])

  const handleCancel = useCallback(() => {
    void handleBack()
  }, [handleBack])

  const handleSubmit = useCallback(() => {
    if (isSubmitting || !account || amountInWei <= 0n || hasInsufficientBalance) return

    if (mode === 'unstake' && !shareValue) {
      addToast(t("We couldn't load the unstaking details. Please try again."), { type: 'error' })
      void loadShareValue()
      return
    }

    const calls =
      mode === 'stake'
        ? getStakeWalletCalls(amountInWei)
        : getUnstakeWalletCalls(amountInWei, shareValue!)

    shouldPersistStakingRouteRef.current = false
    setHasMadeRequest(true)
    setIsSubmitting(true)
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
    hasInsufficientBalance,
    isSubmitting,
    loadShareValue,
    mode,
    requestsDispatch,
    shareValue,
    t
  ])

  useEffect(() => {
    shouldPersistStakingRouteRef.current = shouldPersistStakingRoute
    if (!isWeb) return undefined

    let isActive = true
    const persistenceRequest = shouldPersistStakingRoute
      ? storage.set(WALLET_STAKING_ROUTE_STORAGE_KEY, true)
      : storage.remove(WALLET_STAKING_ROUTE_STORAGE_KEY)

    persistenceRequest.catch((error) => {
      console.error('Failed to update the WALLET staking route persistence', error)
      captureException(error)
      if (isActive) {
        addToast(t("We couldn't remember whether to reopen the staking page. Please try again."), {
          type: 'error'
        })
      }
    })

    return () => {
      isActive = false
    }
  }, [addToast, shouldPersistStakingRoute, t])

  useEffect(
    () => () => {
      shareValueRequestIdRef.current += 1

      if (!isWeb || shouldPersistStakingRouteRef.current) return

      storage.remove(WALLET_STAKING_ROUTE_STORAGE_KEY).catch((error) => {
        console.error('Failed to clear the WALLET staking route on unmount', error)
        captureException(error)
      })
    },
    []
  )

  return (
    <LayoutWrapper>
      <Header.Wrapper>
        <Header.Container side="left">
          <Header.BackButton forceBack onGoBackPress={handleBack} />
        </Header.Container>
        <Header.Title>{t('$WALLET Staking')}</Header.Title>
        <Header.Container side="right" />
      </Header.Wrapper>
      <View style={styles.screenContent}>
        <View>
          <View style={styles.learnMore}>
            <Text fontSize={12} appearance="secondaryText">
              {t('Learn more about')}{' '}
            </Text>
            <AnimatedPressable onPress={handleOpenHelp}>
              <Text fontSize={12} color={theme.primaryAccent200}>
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

          {shouldShowEmptyState ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <InfoIcon width={64} height={64} color={theme.infoText} />
              </View>
              <Text fontSize={16} style={styles.emptyText}>
                {t('You don’t have any $WALLET or stkWALLET tokens in your portfolio.')}
              </Text>
              <GlassView borderRadius={32} cssStyle={{ overflow: 'hidden' }}>
                <View style={styles.buyWalletWrapper}>
                  <Button
                    type="primary"
                    text={t('Buy $WALLET')}
                    onPress={handleBuyWallet}
                    hasBottomSpacing={false}
                    style={styles.buyWalletButton}
                    testID="wallet-staking-buy-wallet"
                    size="smaller"
                  />
                </View>
              </GlassView>
            </View>
          ) : (
            <>
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
                  <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                    <Text fontSize={13} appearance="secondaryText">
                      {t('2% (variable rate)')}
                    </Text>
                    <InfoIcon
                      width={14}
                      height={14}
                      color={theme.secondaryText}
                      data-tooltip-id={STAKING_APY_TOOLTIP_ID}
                      style={spacings.mlTy}
                    />
                    <Tooltip id={STAKING_APY_TOOLTIP_ID} clickable>
                      {stakingApyTooltipContent}
                    </Tooltip>
                  </View>
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
            </>
          )}
        </View>

        {!shouldShowEmptyState && (
          <View style={styles.footerRow}>
            <GlassView borderRadius={32} cssStyle={{ overflow: 'hidden' }}>
              <View style={styles.footer}>
                <Button
                  type="secondary"
                  text={t('Cancel')}
                  onPress={handleCancel}
                  hasBottomSpacing={false}
                  style={styles.footerButton}
                />
                <Button
                  type="primary"
                  text={submitButtonText}
                  onPress={handleSubmit}
                  disabled={isSubmitDisabled || (mode === 'unstake' && !shareValue)}
                  hasBottomSpacing={false}
                  style={styles.footerButton}
                />
              </View>
            </GlassView>
          </View>
        )}
      </View>
    </LayoutWrapper>
  )
}

export default React.memo(WalletStakingScreen)
