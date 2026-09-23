import { formatUnits, parseUnits } from 'ethers'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useModalize } from 'react-native-modalize'

import { STK_WALLET, WALLET_STAKING_ADDR, WALLET_TOKEN } from '@ambire-common/consts/addresses'
import { ETHEREUM_CHAIN_ID } from '@ambire-common/consts/networks'
import { TokenResult } from '@ambire-common/libs/portfolio'
import { getTokenAmount } from '@ambire-common/libs/portfolio/helpers'
import {
  getFeePercent,
  SWAP_AND_BRIDGE_FEE_THRESHOLDS
} from '@ambire-common/libs/swapAndBridge/fee'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useStkWalletFeePercent from '@common/hooks/useStkWalletFeePercent'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { ROUTES } from '@common/modules/router/constants/common'
import { WALLET_STAKING_ROUTE_STORAGE_KEY } from '@common/modules/wallet-staking/constants/staking'
import {
  getStakeWalletCalls,
  getUnstakeWalletCalls,
  getWalletStakingAmountInWei,
  getWithdrawWalletCalls
} from '@common/modules/wallet-staking/helpers/calls'
import {
  formatPendingWalletWithdrawalDuration,
  isPendingWalletWithdrawalReady,
  shouldUsePendingWalletWithdrawalMode
} from '@common/modules/wallet-staking/helpers/pendingWithdrawal'
import usePendingWalletWithdrawal from '@common/modules/wallet-staking/hooks/usePendingWalletWithdrawal'
import useXWalletShareValue from '@common/modules/wallet-staking/hooks/useXWalletShareValue'
import { storage } from '@common/services/storage'
import { ACCENT_PRIMITIVES } from '@common/styles/theme/primitives'
import { THEME_TYPES } from '@common/styles/theme/types'

import type { Call } from '@ambire-common/libs/accountOp/types'
import type { WalletStakingMode } from '@common/modules/wallet-staking/constants/staking'

const TOKEN_DECIMALS = 18
const EMPTY_STATE_BALANCE_THRESHOLD = parseUnits('0.001', TOKEN_DECIMALS)
const FIAT_DECIMALS = 2

/**
 * Renders a converted amount as plain field text - fixed to the field's own precision, without
 * the exponent notation `String()` falls into for very small numbers, and without the trailing
 * zeros that would fight the user's next keystroke.
 */
const toAmountFieldValue = (value: number, precision: number) => {
  if (!Number.isFinite(value) || value <= 0) return ''

  const fixed = value.toFixed(precision)
  if (!fixed.includes('.')) return fixed

  let end = fixed.length
  while (end > 0 && fixed[end - 1] === '0') end -= 1
  if (fixed[end - 1] === '.') end -= 1

  return fixed.slice(0, end)
}

const getUsdPrice = (token?: TokenResult) =>
  token?.priceIn.find(({ baseCurrency }) => baseCurrency.toLowerCase() === 'usd')?.price

const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account
const selectPortfolioTokens = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.tokens
const selectIsPortfolioReady = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.isReadyToVisualize
const selectCurrentUserRequest = (state: AllControllersMappingType['RequestsController']) =>
  state.currentUserRequest
const selectXWalletShareValue = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.walletStaking?.shareValue
const selectXWalletLockedShares = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.portfolio.walletStaking?.lockedShares

/**
 * Everything the $WALLET Staking screen needs: the stake/unstake form state, the balances and
 * conversions it is drawn from, and the request it dispatches. The mobile and the extension
 * screens differ only in layout, so all of it lives here.
 */
const useWalletStakingForm = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
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
  const { state: xWalletShareValue } = useController(
    'SelectedAccountController',
    selectXWalletShareValue
  )
  const { state: xWalletLockedShares } = useController(
    'SelectedAccountController',
    selectXWalletLockedShares
  )
  const { state: currentUserRequest, dispatch: requestsDispatch } = useController(
    'RequestsController',
    selectCurrentUserRequest
  )
  const [mode, setMode] = useState<WalletStakingMode>(() =>
    params?.mode === 'unstake' ? 'unstake' : 'stake'
  )
  const [amount, setAmount] = useState('')
  // The amount field can be typed in either the token or its USD value. `amount` stays the token
  // amount throughout (everything downstream - the slider, the calls, the fee preview - works in
  // tokens), and `fiatAmount` is only what the field shows while in fiat mode.
  const [amountFieldMode, setAmountFieldMode] = useState<'token' | 'fiat'>('token')
  const [fiatAmount, setFiatAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasMadeRequest, setHasMadeRequest] = useState(false)
  const hasActiveSubmissionRef = useRef(false)
  const shouldPersistStakingRouteRef = useRef(false)

  const { shareValue, isLoadingShareValue, loadShareValue } = useXWalletShareValue(mode)
  const {
    pendingWithdrawal,
    totalPendingShares,
    isLoading: isLoadingPendingWithdrawal,
    hasLoadFailed: hasPendingWithdrawalLoadFailed,
    nowMs,
    reload: reloadPendingWithdrawal
  } = usePendingWalletWithdrawal(account?.addr)

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
  // The staking contract holds shares for a withdrawal we can't describe: the leave event reaches
  // us through the relayer's logs, which lag the transaction, and the cached copy is gone
  // (another device, or cleared storage). The unstake form stays locked either way - those shares
  // are committed - so the screen says the details are missing instead of showing an amount and a
  // timer it doesn't have.
  const isMissingWithdrawalDetails =
    mode === 'unstake' &&
    !isLoadingPendingWithdrawal &&
    !pendingWithdrawal &&
    (xWalletLockedShares || 0n) > 0n
  const shouldDisableStakingForm = isPendingWithdrawalMode || isMissingWithdrawalDetails
  const isWithdrawalReady = pendingWithdrawal
    ? isPendingWalletWithdrawalReady(pendingWithdrawal.unlocksAt, nowMs)
    : false
  const shouldShowEmptyState =
    isPortfolioReady &&
    walletBalance < EMPTY_STATE_BALANCE_THRESHOLD &&
    stkWalletBalance < EMPTY_STATE_BALANCE_THRESHOLD &&
    !isPendingWithdrawalMode &&
    // Unstaking the whole balance empties both, so the locked shares are the whole story here -
    // "buy some $WALLET" would be the wrong thing to say while a withdrawal is still pending.
    !isMissingWithdrawalDetails
  const balance = mode === 'stake' ? walletBalance : stkWalletBalance
  // One price for both WALLET and stkWALLET: staking mints stkWALLET 1:1 for the WALLET
  // deposited, so a share is worth exactly the token it was minted for. Read from whichever of
  // the two the portfolio prices, because it only carries the tokens the account actually holds
  // - an account with no stkWALLET yet has no stkWALLET token to read a price off, and one that
  // has staked everything has no WALLET token. Falling back to 0 there would value the whole
  // stake/unstake flow at $0, and would drop the priced-at-nothing segment out of the balance
  // ratio ring as the user drags the slider.
  const walletPrice = useMemo(
    () => getUsdPrice(walletToken) ?? getUsdPrice(stkWalletToken) ?? 0,
    [stkWalletToken, walletToken]
  )
  // xWALLET is priced separately - a share is worth `shareValue` WALLET, not 1:1 - so when the
  // portfolio has no price for it, WALLET's price is converted at that rate rather than reused
  // as-is. The rate comes from the portfolio's shared copy (the same one the conversion tooltips
  // read), so no extra RPC call is needed; it's undefined until that first read lands, which
  // just leaves the price at 0 for as long as the portfolio itself can't value the balance.
  const xWalletPrice = useMemo(() => {
    const portfolioPrice = getUsdPrice(xWalletToken)
    if (portfolioPrice !== undefined) return portfolioPrice
    if (!xWalletShareValue) return 0

    return walletPrice * Number(formatUnits(xWalletShareValue, TOKEN_DECIMALS))
  }, [walletPrice, xWalletShareValue, xWalletToken])
  const amountInWei = getWalletStakingAmountInWei(amount)
  const hasInsufficientBalance = amountInWei > balance
  // A zero typed into the field, as opposed to an empty one. Read from the unit the field shows,
  // because a USD zero leaves the token amount empty rather than at zero
  const amountFieldValue = amountFieldMode === 'fiat' ? fiatAmount : amount
  const hasZeroAmount = amountFieldValue !== '' && Number(amountFieldValue) === 0
  const balanceLabel = useMemo(
    () => formatDecimals(Number(formatUnits(balance, TOKEN_DECIMALS)), 'amount'),
    [balance]
  )
  const tokenSymbol = mode === 'stake' ? '$WALLET' : 'stkWALLET'
  const amountInUsd = useMemo(() => {
    const usdAmount = Number(amount || 0) * walletPrice

    // An empty field is worth nothing at all, so the two decimals formatDecimals keeps for a
    // value ("$0.00") are just noise next to it
    return usdAmount ? formatDecimals(usdAmount, 'value') : '$0'
  }, [amount, walletPrice])
  // What the field shows next to the flip icon while it's taking a USD amount
  const amountInToken = useMemo(
    () => `${formatDecimals(Number(amount || 0), 'amount')} ${tokenSymbol}`,
    [amount, tokenSymbol]
  )
  // The "current" badge is based on the confirmed on-chain stkWALLET balance (shared with
  // SwapAndBridgeController, so it always matches the fee a real swap would apply right now) -
  // deliberately NOT the pending balance below, since it's meant to show the fee as it stands
  // today, before this (still unsubmitted) stake/unstake is accounted for.
  const currentFeePercent = useStkWalletFeePercent()
  // Staking mints stkWALLET 1:1 for the WALLET deposited (no share-value conversion - that only
  // applies to xWALLET, which is priced at shareValue WALLET/stkWALLET per share), so the
  // projected tier badge previews what staking the entered amount would move the user into by
  // just adding it on top of the pending stkWALLET balance - the same balance the slider itself
  // is drawn against (see `tierOffset` on AmountSlider below), so the two always agree. Unstaking
  // removes stkWALLET instead, so it subtracts - and can only worsen (or keep) the fee tier,
  // never improve it.
  const projectedStkWalletAmount = useMemo(() => {
    const pendingStkWalletAmount = Number(formatUnits(stkWalletBalance, TOKEN_DECIMALS))
    const enteredAmount = Number(formatUnits(amountInWei, TOKEN_DECIMALS))

    return mode === 'stake'
      ? pendingStkWalletAmount + enteredAmount
      : Math.max(0, pendingStkWalletAmount - enteredAmount)
  }, [amountInWei, mode, stkWalletBalance])
  const projectedFeePercent = useMemo(
    () => getFeePercent(projectedStkWalletAmount),
    [projectedStkWalletAmount]
  )
  // The Swap & Bridge fee thresholds, positioned as tick marks along the slider's active
  // (draggable) range and used to color it by tier. In stake mode that range is the $WALLET
  // available to stake, offset by the stkWALLET already staked (the inactive segment at the
  // start), so each division sits at the threshold amount itself - staking up to it is what
  // reaches that tier. In unstake mode it's the current stkWALLET balance itself, starting at 0;
  // what matters there is the *remaining* balance after unstaking, not the amount removed, so
  // each division instead sits at (current balance - threshold) - the drag amount that leaves
  // exactly `threshold` stkWALLET behind - skipped when that's not reachable (the balance is
  // already below the threshold, putting it off the chart).
  const sliderTierMarks = useMemo(() => {
    const feeThresholds = SWAP_AND_BRIDGE_FEE_THRESHOLDS.map((thresholdAmount) => ({
      thresholdAmount,
      thresholdWei: parseUnits(String(thresholdAmount), TOKEN_DECIMALS)
    }))

    if (mode === 'stake') {
      return feeThresholds.map(({ thresholdAmount, thresholdWei }) => ({
        value: thresholdWei,
        tooltipId: `wallet-staking-slider-threshold-${thresholdAmount}`,
        tooltipContent: t('{{amount}} stkWALLET for a lower Swap & Bridge fee', {
          amount: formatDecimals(thresholdAmount, 'amount')
        })
      }))
    }

    return feeThresholds
      .filter(({ thresholdWei }) => stkWalletBalance - thresholdWei > 0n)
      .map(({ thresholdAmount, thresholdWei }) => ({
        value: stkWalletBalance - thresholdWei,
        tooltipId: `wallet-staking-slider-threshold-${thresholdAmount}`,
        tooltipContent: t('{{amount}} stkWALLET left for a lower Swap & Bridge fee', {
          amount: formatDecimals(thresholdAmount, 'amount')
        })
      }))
  }, [mode, stkWalletBalance, t])
  // Once the account already holds more stkWALLET than the top fee threshold, it's already at
  // the best (0%) tier and staking more can't change that, so the fee preview has nothing useful
  // left to say - stake mode only, since unstaking always risks dropping back out of that tier.
  const shouldShowFeePreview =
    mode !== 'stake' ||
    stkWalletBalance <=
      parseUnits(
        String(SWAP_AND_BRIDGE_FEE_THRESHOLDS[SWAP_AND_BRIDGE_FEE_THRESHOLDS.length - 1]),
        TOKEN_DECIMALS
      )
  // What the entered amount would leave WALLET/stkWALLET at. In stake mode it's moved between
  // those two tokens directly. In unstake mode it does NOT land back in WALLET here - unstaked
  // stkWALLET is locked for the unbonding period rather than
  // immediately spendable WALLET, so showing it as WALLET would overstate what's actually
  // available; its USD value is folded into the xWALLET segment below instead (see
  // `unstakedAmountUsd`), as a stand-in for "no longer stkWALLET, not yet WALLET".
  const projectedWalletBalance =
    mode === 'stake'
      ? walletBalance > amountInWei
        ? walletBalance - amountInWei
        : 0n
      : walletBalance
  const projectedStkWalletBalance =
    mode === 'stake'
      ? stkWalletBalance + amountInWei
      : stkWalletBalance > amountInWei
        ? stkWalletBalance - amountInWei
        : 0n
  // The USD value of stkWALLET being unstaked, redirected into the xWALLET segment (see comment
  // above) instead of into WALLET.
  const unstakedAmountUsd =
    mode === 'unstake' ? Number(formatUnits(amountInWei, TOKEN_DECIMALS)) * walletPrice : 0
  const balanceRatioSegments = useMemo(
    () => [
      {
        key: 'wallet',
        label: '$WALLET',
        valueUsd: Number(formatUnits(projectedWalletBalance, TOKEN_DECIMALS)) * walletPrice,
        // Fixed (not mode-toggled) Ambire brand purples, chosen for contrast against the ring's
        // track and against each other - the semantic theme tokens (e.g. secondaryAccent400) turn
        // into a muted dark teal in light theme and don't read well at this small a size. WALLET
        // and stkWALLET share the primary-purple family (stkWALLET a shade lighter, since it's
        // WALLET once staked); xWALLET is deliberately muted gray instead (see below) since it's
        // not part of the stake/unstake flow.
        color: ACCENT_PRIMITIVES.primaryAccent300[THEME_TYPES.LIGHT]
      },
      {
        key: 'stkWallet',
        label: '$stkWALLET',
        valueUsd: Number(formatUnits(projectedStkWalletBalance, TOKEN_DECIMALS)) * walletPrice,
        color: ACCENT_PRIMITIVES.primaryAccent200[THEME_TYPES.LIGHT]
      },
      {
        key: 'xWallet',
        label: '$xWALLET',
        valueUsd:
          Number(formatUnits(xWalletBalance, TOKEN_DECIMALS)) * xWalletPrice + unstakedAmountUsd,
        // Muted gray rather than a brand hue - xWALLET isn't part of the WALLET <-> stkWALLET
        // split this screen moves between, so it reads as a neutral "rest of your balance".
        color: theme.secondaryText
      }
    ],
    [
      projectedWalletBalance,
      walletPrice,
      projectedStkWalletBalance,
      xWalletBalance,
      xWalletPrice,
      unstakedAmountUsd,
      theme
    ]
  )
  // A ratio only means something once it's a ratio of at least two things - based on the
  // account's actual holdings (not the projected/shifted values above, which would otherwise
  // flicker the ring in and out as the user types) so a token with no price data available still
  // counts as "held" instead of silently reading as zero.
  const shouldShowBalanceRatioProgress =
    [walletBalance, stkWalletBalance, xWalletBalance].filter((tokenBalance) => tokenBalance > 0n)
      .length > 1
  const isSubmitDisabled = useMemo(() => {
    if (!account || isSubmitting || (mode === 'unstake' && isLoadingPendingWithdrawal)) return true
    if (isMissingWithdrawalDetails) return true
    if (isPendingWithdrawalMode) return !isWithdrawalReady || hasPendingWithdrawalLoadFailed
    if (mode === 'unstake' && shareValue === null) return true

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
    isMissingWithdrawalDetails,
    isPendingWithdrawalMode,
    isSubmitting,
    isWithdrawalReady,
    mode,
    shareValue
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

  // Only one of the two fields is ever typed into; the other follows from the price, so flipping
  // the field mode never changes the amount that will actually be staked.
  const setTokenAmount = useCallback(
    (nextAmount: string) => {
      setAmount(nextAmount)
      setFiatAmount(toAmountFieldValue(Number(nextAmount || 0) * walletPrice, FIAT_DECIMALS))
    },
    [walletPrice]
  )
  const handleFiatAmountChange = useCallback(
    (nextFiatAmount: string) => {
      setFiatAmount(nextFiatAmount)
      setAmount(
        walletPrice > 0
          ? toAmountFieldValue(Number(nextFiatAmount || 0) / walletPrice, TOKEN_DECIMALS)
          : ''
      )
    },
    [walletPrice]
  )
  // Without a price there's nothing to convert to, so the field stays on the token it stakes.
  const isAmountFieldModeSwitchDisabled = walletPrice <= 0
  const switchAmountFieldMode = useCallback(() => {
    setAmountFieldMode((prevMode) => (prevMode === 'token' ? 'fiat' : 'token'))
    // Converted here rather than only on every keystroke, so an amount typed before the price
    // had loaded still carries over into the USD field.
    setFiatAmount(toAmountFieldValue(Number(amount || 0) * walletPrice, FIAT_DECIMALS))
  }, [amount, walletPrice])
  const handleSelectMode = useCallback(
    (nextMode: WalletStakingMode) => {
      setMode(nextMode)
      setTokenAmount('')
      setIsSubmitting(false)
      shouldPersistStakingRouteRef.current = false
      if (nextMode === 'unstake' && hasPendingWithdrawalLoadFailed) {
        reloadPendingWithdrawal()
      }
    },
    [hasPendingWithdrawalLoadFailed, reloadPendingWithdrawal, setTokenAmount]
  )

  const handleSliderValueChange = useCallback(
    (nextAmount: bigint) => setTokenAmount(formatUnits(nextAmount, TOKEN_DECIMALS)),
    [setTokenAmount]
  )
  const handleMaxPress = useCallback(() => {
    setTokenAmount(formatUnits(balance, TOKEN_DECIMALS))
  }, [balance, setTokenAmount])
  const handleOpenFeeInfoBottomSheet = useCallback(
    () => openFeeInfoBottomSheet(),
    [openFeeInfoBottomSheet]
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

  const dispatchStakingRequest = useCallback(
    (calls: Call[]) => {
      if (!account) return

      try {
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
      } catch (error) {
        setHasMadeRequest(false)
        setIsSubmitting(false)
        console.error('Failed to start the WALLET staking request', error)
        captureException(error)
        addToast(t("We couldn't start this request. Please try again."), { type: 'error' })
        return
      }

      shouldPersistStakingRouteRef.current = false
      setHasMadeRequest(true)
      setIsSubmitting(true)
    },
    [account, addToast, requestsDispatch, t]
  )

  const handleSubmit = useCallback(() => {
    if (isSubmitting || !account) return

    if (isPendingWithdrawalMode) {
      if (!pendingWithdrawal || !isWithdrawalReady || hasPendingWithdrawalLoadFailed) return

      dispatchStakingRequest(
        getWithdrawWalletCalls(pendingWithdrawal.shares, pendingWithdrawal.unlocksAt)
      )
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

    dispatchStakingRequest(calls)
  }, [
    account,
    addToast,
    amountInWei,
    dispatchStakingRequest,
    hasPendingWithdrawalLoadFailed,
    hasInsufficientBalance,
    isPendingWithdrawalMode,
    isSubmitting,
    isWithdrawalReady,
    loadShareValue,
    mode,
    pendingWithdrawal,
    shareValue,
    t,
    totalPendingShares,
    xWalletBalance
  ])

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
      if (!isWeb || shouldPersistStakingRouteRef.current) return

      storage.remove(WALLET_STAKING_ROUTE_STORAGE_KEY).catch((error) => {
        console.error('Failed to clear the WALLET staking route on unmount', error)
        captureException(error)
      })
    },
    []
  )

  return {
    mode,
    onSelectMode: handleSelectMode,
    amount,
    fiatAmount,
    amountFieldMode,
    onTokenAmountChange: setTokenAmount,
    onFiatAmountChange: handleFiatAmountChange,
    switchAmountFieldMode,
    isAmountFieldModeSwitchDisabled,
    amountInUsd,
    amountInToken,
    amountInWei,
    balance,
    balanceLabel,
    tokenSymbol,
    stkWalletBalance,
    hasInsufficientBalance,
    hasZeroAmount,
    onMaxPress: handleMaxPress,
    onSliderValueChange: handleSliderValueChange,
    sliderTierMarks,
    balanceRatioSegments,
    shouldShowBalanceRatioProgress,
    currentFeePercent,
    projectedFeePercent,
    shouldShowFeePreview,
    feeInfoSheetRef,
    onOpenFeeInfoBottomSheet: handleOpenFeeInfoBottomSheet,
    closeFeeInfoBottomSheet,
    isPendingWithdrawalMode,
    isMissingWithdrawalDetails,
    isWithdrawalReady,
    pendingWithdrawalAmount,
    pendingWithdrawalTime,
    shouldDisableStakingForm,
    shouldShowPendingWithdrawalLoader,
    shouldShowEmptyState,
    submitButtonText,
    isSubmitDisabled,
    onSubmit: handleSubmit,
    onCancel: handleCancel,
    onBack: handleBack,
    onBuyWallet: handleBuyWallet
  }
}

export type WalletStakingFormState = ReturnType<typeof useWalletStakingForm>

export default useWalletStakingForm
