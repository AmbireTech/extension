import { formatUnits, parseUnits } from 'ethers'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { STK_WALLET, WALLET_STAKING_ADDR, WALLET_TOKEN } from '@ambire-common/consts/addresses'
import { ETHEREUM_CHAIN_ID } from '@ambire-common/consts/networks'
import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import { getFeePercent } from '@ambire-common/libs/swapAndBridge/fee'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import InfoIcon from '@common/assets/svg/InfoIcon'
import LockWithTimerIcon from '@common/assets/svg/LockWithTimerIcon'
import SwapAndBridgeIcon from '@common/assets/svg/SwapAndBridgeIcon'
import Button from '@common/components/Button'
import GlassView from '@common/components/GlassView'
import LayoutWrapper from '@common/components/LayoutWrapper'
import NumberInput from '@common/components/NumberInput'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import CONFIG, { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import { AnimatedPressable } from '@common/hooks/useHover'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useStkWalletFeePercent from '@common/hooks/useStkWalletFeePercent'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { WALLET_STAKING_ROUTE_STORAGE_KEY } from '@common/modules/explore/constants/walletStaking'
import Header from '@common/modules/header/components/Header/Header'
import { ROUTES } from '@common/modules/router/constants/common'
import FeeInfoBottomSheet from '@common/modules/swap-and-bridge/components/FeeInfoBottomSheet'
import { storage } from '@common/services/storage'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { openInTab } from '@common/utils/links'

import AmountSlider from './AmountSlider'
import BalanceWithMax from './BalanceWithMax'
import {
  getStakeWalletCalls,
  getUnstakeWalletCalls,
  getWalletStakingMaxAmount,
  getWithdrawWalletCalls
} from './calls'
import {
  decodePendingWalletWithdrawals,
  formatPendingWalletWithdrawalDuration,
  getPendingWalletWithdrawalCommitmentId,
  getPendingWalletWithdrawalStorageKey,
  getPendingWalletWithdrawalSummary,
  isPendingWalletWithdrawalReady,
  LOG_LEAVE_TOPIC,
  parseCachedPendingWalletWithdrawal,
  parseWalletStakingRelayerLogsResponse,
  PendingWalletWithdrawal,
  serializePendingWalletWithdrawal,
  shouldUsePendingWalletWithdrawalMode
} from './pendingWithdrawal'
import getStyles from './styles'
import WalletStakingApy from './WalletStakingApy'

import type { WalletStakingMode } from '@common/modules/explore/constants/walletStaking'
const TOKEN_DECIMALS = 18
const EMPTY_STATE_BALANCE_THRESHOLD = parseUnits('0.001', TOKEN_DECIMALS)
const STAKING_HELP_URL = 'https://help.ambire.com/en/collections/18211458-wallet-token-governance'
const WALLET_STAKING_COMMITMENT_ABI = 'function commitments(bytes32) view returns (uint256)'

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
const selectCurrentUserRequest = (state: AllControllersMappingType['RequestsController']) =>
  state.currentUserRequest

interface TabProps {
  mode: WalletStakingMode
  activeMode: WalletStakingMode
  label: string
  onSelect: (mode: WalletStakingMode) => void
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

const WalletStakingScreen = () => {
  const { t } = useTranslation()
  const { styles, theme } = useTheme(getStyles)
  const { navigate } = useNavigation()
  const { params } = useRoute()
  const { addToast } = useToast()
  const {
    ref: feeInfoSheetRef,
    open: openFeeInfoBottomSheet,
    close: closeFeeInfoBottomSheet
  } = useModalize()
  const { state: account } = useController('SelectedAccountController', selectAccount)
  const { state: portfolioTokens } = useController(
    'SelectedAccountController',
    selectPortfolioTokens
  )
  const { state: isPortfolioReady } = useController(
    'SelectedAccountController',
    selectIsPortfolioReady
  )
  const { state: currentUserRequest, dispatch: requestsDispatch } = useController(
    'RequestsController',
    selectCurrentUserRequest
  )
  const { dispatchAndWait: providersDispatchAndWait } = useController('ProvidersController')
  const [mode, setMode] = useState<WalletStakingMode>(() =>
    params?.mode === 'unstake' ? 'unstake' : 'stake'
  )
  const [amount, setAmount] = useState('')
  const [shareValue, setShareValue] = useState<bigint | null>(null)
  const [isLoadingShareValue, setIsLoadingShareValue] = useState(false)
  const [pendingWithdrawal, setPendingWithdrawal] = useState<PendingWalletWithdrawal | null>(null)
  const [totalPendingShares, setTotalPendingShares] = useState(0n)
  const [isLoadingPendingWithdrawal, setIsLoadingPendingWithdrawal] = useState(true)
  const [hasPendingWithdrawalLoadFailed, setHasPendingWithdrawalLoadFailed] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasMadeRequest, setHasMadeRequest] = useState(false)
  const shareValueRequestIdRef = useRef(0)
  const isLoadingShareValueRef = useRef(false)
  const hasActiveSubmissionRef = useRef(false)
  const pendingWithdrawalRequestIdRef = useRef(0)
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
  const xWalletToken = useMemo(
    () =>
      portfolioTokens.find(
        (token) =>
          token.chainId === ETHEREUM_CHAIN_ID &&
          token.address.toLowerCase() === WALLET_STAKING_ADDR.toLowerCase()
      ),
    [portfolioTokens]
  )
  // Uses the pending simulated balance (post account-op) when available, falling back to the
  // on-chain balance otherwise.
  const walletBalance = useMemo(
    () => (walletToken ? getTokenAmount(walletToken) : 0n),
    [walletToken]
  )
  const stkWalletBalance = useMemo(
    () => (stkWalletToken ? getTokenAmount(stkWalletToken) : 0n),
    [stkWalletToken]
  )
  const xWalletBalance = useMemo(
    () => (xWalletToken ? getTokenAmount(xWalletToken) : 0n),
    [xWalletToken]
  )
  const isPendingWithdrawalMode =
    mode === 'unstake' &&
    shouldUsePendingWalletWithdrawalMode(pendingWithdrawal, xWalletBalance, totalPendingShares)
  const shouldShowPendingWithdrawalLoader = mode === 'unstake' && isLoadingPendingWithdrawal
  const isWithdrawalReady = pendingWithdrawal
    ? isPendingWalletWithdrawalReady(pendingWithdrawal.unlocksAt, nowMs)
    : false
  const shouldShowEmptyState =
    isPortfolioReady &&
    walletBalance < EMPTY_STATE_BALANCE_THRESHOLD &&
    stkWalletBalance < EMPTY_STATE_BALANCE_THRESHOLD &&
    !isPendingWithdrawalMode
  const activeToken = mode === 'stake' ? walletToken : stkWalletToken
  const balance = mode === 'stake' ? walletBalance : stkWalletBalance
  const price = useMemo(
    () =>
      activeToken?.priceIn.find(({ baseCurrency }) => baseCurrency.toLowerCase() === 'usd')
        ?.price ??
      walletToken?.priceIn.find(({ baseCurrency }) => baseCurrency.toLowerCase() === 'usd')
        ?.price ??
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
  // The current tier badge is based on the confirmed on-chain stkWALLET balance (shared with
  // SwapAndBridgeController, so this always matches the fee a real swap would apply right now).
  const currentFeePercent = useStkWalletFeePercent()
  // The projected tier badge previews what staking the entered amount would move the user into,
  // starting from the same pending/simulated stkWALLET balance the staking form itself uses
  // (falls back to the on-chain amount if there's nothing pending), rather than the confirmed
  // on-chain balance used for the current tier above, since it's a forward-looking estimate
  // anyway. Named distinctly from the pending-withdrawal balance tracked elsewhere in this file -
  // "simulated" here refers to TokenResult.amountPostSimulation, not an in-progress unstake.
  const simulatedStkWalletAmount = useMemo(
    () => Number(formatUnits(stkWalletBalance, TOKEN_DECIMALS)),
    [stkWalletBalance]
  )
  // Staking mints stkWALLET 1:1 for the WALLET deposited (no share-value conversion - that only
  // applies to xWALLET, which is priced at shareValue WALLET/stkWALLET per share), so the
  // projected balance is just the entered amount added on top of the current one.
  const projectedStkWalletAmount = useMemo(
    () => simulatedStkWalletAmount + Number(formatUnits(amountInWei, TOKEN_DECIMALS)),
    [amountInWei, simulatedStkWalletAmount]
  )
  const projectedFeePercent = useMemo(
    () => getFeePercent(projectedStkWalletAmount),
    [projectedStkWalletAmount]
  )
  const tokenSymbol = mode === 'stake' ? '$WALLET' : 'stkWALLET'
  const isSubmitDisabled = useMemo(() => {
    if (!account || isSubmitting || (mode === 'unstake' && isLoadingPendingWithdrawal)) return true
    if (isPendingWithdrawalMode) return !isWithdrawalReady || hasPendingWithdrawalLoadFailed

    return (
      amountInWei <= 0n ||
      hasInsufficientBalance ||
      (mode === 'unstake' && (isLoadingShareValue || hasPendingWithdrawalLoadFailed))
    )
  }, [
    account,
    amountInWei,
    hasInsufficientBalance,
    hasPendingWithdrawalLoadFailed,
    isLoadingPendingWithdrawal,
    isLoadingShareValue,
    isPendingWithdrawalMode,
    isSubmitting,
    isWithdrawalReady,
    mode
  ])
  const submitButtonText = useMemo(() => {
    if (isLoadingPendingWithdrawal && mode === 'unstake') return t('Loading...')
    if (isSubmitting) {
      if (mode === 'stake') return t('Staking...')
      return isPendingWithdrawalMode ? t('Withdrawing...') : t('Unstaking...')
    }
    if (mode === 'stake') return t('Stake')
    return isPendingWithdrawalMode ? t('Withdraw') : t('Unstake')
  }, [isLoadingPendingWithdrawal, isPendingWithdrawalMode, isSubmitting, mode, t])
  const pendingWithdrawalAmount = useMemo(
    () =>
      pendingWithdrawal
        ? formatDecimals(Number(formatUnits(pendingWithdrawal.maxTokens, TOKEN_DECIMALS)), 'amount')
        : '',
    [pendingWithdrawal]
  )
  const pendingWithdrawalTime = useMemo(
    () =>
      pendingWithdrawal
        ? formatPendingWalletWithdrawalDuration(pendingWithdrawal.unlocksAt, nowMs)
        : '',
    [nowMs, pendingWithdrawal]
  )
  const shouldPersistStakingRoute = Boolean(amount.trim()) && !hasMadeRequest

  const loadPendingWithdrawal = useCallback(
    async (signal?: AbortSignal) => {
      const accountAddr = account?.addr
      const requestId = ++pendingWithdrawalRequestIdRef.current
      setPendingWithdrawal(null)
      setTotalPendingShares(0n)
      setHasPendingWithdrawalLoadFailed(false)

      if (!accountAddr) {
        setIsLoadingPendingWithdrawal(false)
        return
      }

      setIsLoadingPendingWithdrawal(true)
      const storageKey = getPendingWalletWithdrawalStorageKey(accountAddr)
      let cachedPendingWithdrawal: PendingWalletWithdrawal | null = null

      const removeCachedPendingWithdrawal = async () => {
        try {
          await storage.remove(storageKey)
        } catch (error) {
          console.error('Failed to remove the pending WALLET withdrawal cache', error)
          captureException(error)
        }
      }

      const persistPendingWithdrawal = async (withdrawal: PendingWalletWithdrawal) => {
        try {
          await storage.set(storageKey, serializePendingWalletWithdrawal(withdrawal))
        } catch (error) {
          console.error('Failed to cache the pending WALLET withdrawal', error)
          captureException(error)
        }
      }

      const getCommitmentMaxTokens = async (withdrawal: PendingWalletWithdrawal) => {
        const commitmentId = getPendingWalletWithdrawalCommitmentId(accountAddr, withdrawal)
        const maxTokens = await providersDispatchAndWait<'callContractAndSendResToUi', bigint>({
          type: 'method',
          params: {
            method: 'callContractAndSendResToUi',
            args: [
              {
                chainId: ETHEREUM_CHAIN_ID,
                address: WALLET_STAKING_ADDR,
                abi: WALLET_STAKING_COMMITMENT_ABI,
                method: 'commitments',
                args: [commitmentId]
              }
            ]
          }
        })

        return BigInt(maxTokens)
      }

      try {
        try {
          const cachedValue = await storage.get(storageKey)
          cachedPendingWithdrawal = parseCachedPendingWalletWithdrawal(cachedValue)
          if (cachedValue && !cachedPendingWithdrawal) await removeCachedPendingWithdrawal()
        } catch (error) {
          console.error('Failed to read the pending WALLET withdrawal cache', error)
          captureException(error)
        }

        const response = await fetch(`${CONFIG.RELAYER_URL}/v2/identity/logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identity: accountAddr,
            address: WALLET_STAKING_ADDR,
            requestedTopic: LOG_LEAVE_TOPIC
          }),
          signal
        })
        if (!response.ok) throw new Error(`The relayer returned HTTP ${response.status}.`)

        const logs = parseWalletStakingRelayerLogsResponse(await response.json())
        const decodedWithdrawals = decodePendingWalletWithdrawals(logs, accountAddr)
        const withdrawalsById = new Map<string, PendingWalletWithdrawal>()
        if (cachedPendingWithdrawal) {
          withdrawalsById.set(
            `${cachedPendingWithdrawal.shares}:${cachedPendingWithdrawal.unlocksAt}`,
            cachedPendingWithdrawal
          )
        }
        decodedWithdrawals.forEach((withdrawal) => {
          withdrawalsById.set(`${withdrawal.shares}:${withdrawal.unlocksAt}`, withdrawal)
        })
        const activeWithdrawals = (
          await Promise.all(
            Array.from(withdrawalsById.values()).map(async (withdrawal) => {
              const maxTokens = await getCommitmentMaxTokens(withdrawal)
              return maxTokens > 0n ? { ...withdrawal, maxTokens } : null
            })
          )
        ).filter((withdrawal): withdrawal is PendingWalletWithdrawal => !!withdrawal)
        const { latestWithdrawal, totalShares } =
          getPendingWalletWithdrawalSummary(activeWithdrawals)

        if (latestWithdrawal) await persistPendingWithdrawal(latestWithdrawal)
        else await removeCachedPendingWithdrawal()

        if (requestId === pendingWithdrawalRequestIdRef.current && !signal?.aborted) {
          setPendingWithdrawal(latestWithdrawal)
          setTotalPendingShares(totalShares)
        }
      } catch (error) {
        if (signal?.aborted || (error instanceof Error && error.name === 'AbortError')) return

        console.error('Failed to load pending WALLET withdrawals', error)
        captureException(error)
        if (requestId === pendingWithdrawalRequestIdRef.current) {
          setPendingWithdrawal(cachedPendingWithdrawal)
          setTotalPendingShares(cachedPendingWithdrawal?.shares || 0n)
          setHasPendingWithdrawalLoadFailed(true)
          addToast(t("We couldn't check your pending withdrawal. Please try again."), {
            type: 'error'
          })
        }
      } finally {
        if (requestId === pendingWithdrawalRequestIdRef.current && !signal?.aborted) {
          setIsLoadingPendingWithdrawal(false)
        }
      }
    },
    [account?.addr, addToast, providersDispatchAndWait, t]
  )

  const loadShareValue = useCallback(async () => {
    if (shareValue !== null || isLoadingShareValueRef.current) return

    const requestId = ++shareValueRequestIdRef.current
    isLoadingShareValueRef.current = true
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
      const normalizedShareValue = BigInt(nextShareValue)
      if (normalizedShareValue <= 0n) {
        throw new Error('The WALLET staking conversion rate is unavailable.')
      }

      if (requestId === shareValueRequestIdRef.current) setShareValue(normalizedShareValue)
    } catch (error) {
      if (requestId !== shareValueRequestIdRef.current) return

      console.error('Failed to load WALLET staking share value', error)
      captureException(error)
      addToast(t("We couldn't load the unstaking details. Please try again."), { type: 'error' })
    } finally {
      isLoadingShareValueRef.current = false
      if (requestId === shareValueRequestIdRef.current) setIsLoadingShareValue(false)
    }
  }, [addToast, providersDispatchAndWait, shareValue, t])

  const handleSelectMode = useCallback(
    (nextMode: WalletStakingMode) => {
      setMode(nextMode)
      setAmount('')
      setIsSubmitting(false)
      shouldPersistStakingRouteRef.current = false
      if (nextMode === 'unstake' && hasPendingWithdrawalLoadFailed) {
        void loadPendingWithdrawal()
      }
    },
    [hasPendingWithdrawalLoadFailed, loadPendingWithdrawal]
  )

  const handleSliderValueChange = useCallback(
    (nextAmount: bigint) => setAmount(formatUnits(nextAmount, TOKEN_DECIMALS)),
    []
  )
  const handleMaxPress = useCallback(() => {
    const maxAmount = getWalletStakingMaxAmount(balance, mode)
    setAmount(formatUnits(maxAmount, TOKEN_DECIMALS))
  }, [balance, mode])
  const handleOpenFeeInfoBottomSheet = useCallback(
    () => openFeeInfoBottomSheet(),
    [openFeeInfoBottomSheet]
  )

  const handleOpenHelp = useCallback(() => {
    openInTab({ url: STAKING_HELP_URL }).catch((error) => {
      console.error('Failed to open WALLET staking help', error)
      captureException(error)
      addToast(t("We couldn't open the staking guide."), { type: 'error' })
    })
  }, [addToast, t])

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
    if (isSubmitting || !account) return

    if (isPendingWithdrawalMode) {
      if (!pendingWithdrawal || !isWithdrawalReady || hasPendingWithdrawalLoadFailed) return

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
                  calls: getWithdrawWalletCalls(
                    pendingWithdrawal.shares,
                    pendingWithdrawal.unlocksAt
                  ),
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
      return
    }

    if (amountInWei <= 0n || hasInsufficientBalance) return

    if (mode === 'unstake' && shareValue === null) {
      addToast(t("We couldn't load the unstaking details. Please try again."), { type: 'error' })
      void loadShareValue()
      return
    }

    const missingPendingShares =
      totalPendingShares > xWalletBalance ? totalPendingShares - xWalletBalance : 0n
    const calls =
      mode === 'stake'
        ? getStakeWalletCalls(amountInWei)
        : getUnstakeWalletCalls(amountInWei, shareValue!, missingPendingShares)

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
    hasPendingWithdrawalLoadFailed,
    hasInsufficientBalance,
    isPendingWithdrawalMode,
    isSubmitting,
    isWithdrawalReady,
    loadShareValue,
    mode,
    pendingWithdrawal,
    requestsDispatch,
    shareValue,
    t,
    totalPendingShares,
    xWalletBalance
  ])

  useEffect(() => {
    if (mode !== 'unstake') return undefined

    const loadTimeout = setTimeout(() => void loadShareValue(), 0)
    return () => clearTimeout(loadTimeout)
  }, [loadShareValue, mode])

  useEffect(() => {
    if (!isSubmitting) {
      hasActiveSubmissionRef.current = false
      return
    }

    const isSubmittedRequestActive =
      currentUserRequest?.kind === 'calls' &&
      currentUserRequest.meta.accountAddr === account?.addr &&
      currentUserRequest.meta.chainId === ETHEREUM_CHAIN_ID
    if (isSubmittedRequestActive) {
      hasActiveSubmissionRef.current = true
      return
    }
    if (!hasActiveSubmissionRef.current) return

    hasActiveSubmissionRef.current = false
    setIsSubmitting(false)
  }, [account?.addr, currentUserRequest, isSubmitting])

  useEffect(() => {
    const abortController = new AbortController()
    const loadTimeout = setTimeout(() => {
      void loadPendingWithdrawal(abortController.signal)
    }, 0)

    return () => {
      clearTimeout(loadTimeout)
      abortController.abort()
      pendingWithdrawalRequestIdRef.current += 1
    }
  }, [loadPendingWithdrawal])

  useEffect(() => {
    if (!pendingWithdrawal) return undefined

    const countdownInterval = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(countdownInterval)
  }, [pendingWithdrawal])

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
        <View style={styles.mainContent}>
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

          {shouldShowPendingWithdrawalLoader ? (
            <View style={styles.loadingState}>
              <Text fontSize={24}>{t('Loading...')}</Text>
              <Spinner style={{ width: 28, height: 28 }} />
            </View>
          ) : (
            <View style={styles.stakingFormContainer}>
              {isPendingWithdrawalMode && (
                <View style={styles.pendingWithdrawalCard}>
                  <View style={styles.pendingWithdrawalIcon}>
                    <LockWithTimerIcon width={54} height={54} color={theme.errorText} />
                  </View>
                  {isWithdrawalReady ? (
                    <>
                      <Text fontSize={18} weight="semiBold" style={styles.pendingWithdrawalText}>
                        {t('Ready to withdraw')}
                      </Text>
                      <Text fontSize={24} weight="number_bold" style={styles.pendingWithdrawalText}>
                        {pendingWithdrawalAmount} $WALLET
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text fontSize={20} weight="number_bold" style={styles.pendingWithdrawalText}>
                        {pendingWithdrawalAmount} $WALLET
                      </Text>
                      <Text fontSize={16} weight="medium" style={styles.pendingWithdrawalText}>
                        {t('will be available in')}
                      </Text>
                      <Text fontSize={24} weight="number_bold" style={styles.pendingWithdrawalText}>
                        {pendingWithdrawalTime}
                      </Text>
                    </>
                  )}
                  <Text
                    fontSize={13}
                    appearance="secondaryText"
                    style={styles.pendingWithdrawalDescription}
                  >
                    {isWithdrawalReady
                      ? t('Your $WALLET is ready. Withdraw it before starting another unstake.')
                      : t(
                          'You can withdraw and unstake more as soon as the locking period has ended.'
                        )}
                  </Text>
                </View>
              )}

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
                <View
                  pointerEvents={isPendingWithdrawalMode ? 'none' : 'auto'}
                  style={isPendingWithdrawalMode ? styles.disabledStakingForm : undefined}
                >
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
                      <BalanceWithMax
                        balanceLabel={balanceLabel}
                        disabled={balance <= 0n}
                        onMaxPress={handleMaxPress}
                        testID="wallet-staking-max-button"
                      />
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

                    <AmountSlider
                      value={amountInWei}
                      maximumValue={balance}
                      maximumLabel={balanceLabel}
                      onValueChange={handleSliderValueChange}
                    />

                    {mode === 'stake' && (
                      <View style={styles.feePreviewRow}>
                        <View style={styles.feePreviewLabel}>
                          <Text fontSize={12} appearance="secondaryText">
                            {t('Swap & Bridge fee')}
                          </Text>
                          <Button
                            text={t('Details')}
                            type="outline"
                            size="tiny"
                            accentColor={theme.primaryAccent300}
                            onPress={handleOpenFeeInfoBottomSheet}
                            hasBottomSpacing={false}
                            submitOnEnter={false}
                            style={styles.feeDetailsButton}
                            testID="wallet-staking-fee-details-button"
                          />
                        </View>
                        <View style={[flexbox.directionRow, flexbox.alignCenter]}>
                          <Text fontSize={12} appearance="secondaryText">
                            {currentFeePercent.toFixed(2)}%
                          </Text>
                          <Text fontSize={12} appearance="secondaryText" style={spacings.phTy}>
                            →
                          </Text>
                          <Text fontSize={12} weight="semiBold" color={theme.primaryAccent200}>
                            {projectedFeePercent.toFixed(2)}%
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>

                  <View style={styles.details}>
                    <WalletStakingApy />
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
              )}
            </View>
          )}
        </View>

        {!shouldShowPendingWithdrawalLoader && !shouldShowEmptyState && (
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
                  disabled={
                    isSubmitDisabled ||
                    (mode === 'unstake' && !isPendingWithdrawalMode && shareValue === null)
                  }
                  hasBottomSpacing={false}
                  style={styles.footerButton}
                />
              </View>
            </GlassView>
          </View>
        )}
        <FeeInfoBottomSheet
          sheetRef={feeInfoSheetRef}
          closeBottomSheet={closeFeeInfoBottomSheet}
          feePercent={currentFeePercent}
          withActions={false}
          withCloseAction
        />
      </View>
    </LayoutWrapper>
  )
}

export default React.memo(WalletStakingScreen)
