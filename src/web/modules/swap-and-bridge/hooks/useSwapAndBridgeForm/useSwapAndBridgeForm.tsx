import { formatUnits, getAddress, isAddress, parseUnits } from 'ethers'
import { nanoid } from 'nanoid'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useModalize } from 'react-native-modalize'

import { SwapAndBridgeFormStatus } from '@ambire-common/controllers/swapAndBridge/swapAndBridge'
import { AccountOpAction } from '@ambire-common/interfaces/actions'
import { SwapAndBridgeToToken } from '@ambire-common/interfaces/swapAndBridge'
import { TokenResult } from '@ambire-common/libs/portfolio'
import {
  getIsNetworkSupported,
  getIsTokenEligibleForSwapAndBridge
} from '@ambire-common/libs/swapAndBridge/swapAndBridge'
import { getSanitizedAmount } from '@ambire-common/libs/transfer/amount'
import formatDecimals from '@ambire-common/utils/formatDecimals/formatDecimals'
import NetworkIcon from '@common/components/NetworkIcon'
import { SelectValue } from '@common/components/Select/types'
import Text from '@common/components/Text'
import useGetTokenSelectProps from '@common/hooks/useGetTokenSelectProps'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'
import NotSupportedNetworkTooltip from '@web/modules/swap-and-bridge/components/NotSupportedNetworkTooltip'
import { getTokenId } from '@web/utils/token'

type SessionId = ReturnType<typeof nanoid>

const useSwapAndBridgeForm = () => {
  const {
    fromAmount,
    fromSelectedToken,
    fromAmountFieldMode,
    toSelectedToken,
    portfolioTokenList,
    isTokenListLoading,
    toTokenList,
    maxFromAmount,
    maxFromAmountInFiat,
    quote,
    fromAmountInFiat,
    activeRoutes,
    formStatus,
    toChainId,
    updateToTokenListStatus,
    supportedChainIds,
    updateQuoteStatus,
    sessionIds
  } = useSwapAndBridgeControllerState()
  const { account, portfolio } = useSelectedAccountControllerState()
  const [fromAmountValue, setFromAmountValue] = useState<string>(fromAmount)
  const [followUpTransactionConfirmed, setFollowUpTransactionConfirmed] = useState<boolean>(false)
  const [isAutoSelectRouteDisabled, setIsAutoSelectRouteDisabled] = useState<boolean>(false)
  /**
   * @deprecated - the settings menu is not used anymore
   */
  const [settingModalVisible, setSettingsModalVisible] = useState<boolean>(false)
  const { dispatch } = useBackgroundService()
  const { networks } = useNetworksControllerState()
  const { searchParams, setSearchParams } = useNavigation()
  const { theme } = useTheme()
  const prevFromAmount = usePrevious(fromAmount)
  const prevFromAmountInFiat = usePrevious(fromAmountInFiat)
  const { ref: routesModalRef, open: openRoutesModal, close: closeRoutesModal } = useModalize()
  const {
    ref: estimationModalRef,
    open: openEstimationModal,
    close: closeEstimationModal
  } = useModalize()
  const {
    ref: priceImpactModalRef,
    open: openPriceImpactModal,
    close: closePriceImpactModal
  } = useModalize()
  const { actionsQueue } = useActionsControllerState()
  const sessionIdsRequestedToBeInit = useRef<SessionId[]>([])
  const sessionId = useMemo(() => nanoid(), []) // purposely, so it is unique per hook lifetime

  const mainAccountOpActions = useMemo(() => {
    if (!account) return []
    return (actionsQueue.filter((a) => a.type === 'accountOp') as AccountOpAction[]).filter(
      (action) => action.accountOp.accountAddr === account.addr
    )
  }, [account, actionsQueue])
  const isOneClickModeAllowed = useMemo(() => {
    return mainAccountOpActions.length === 0
  }, [mainAccountOpActions])

  const handleSetFromAmount = (val: string) => {
    setFromAmountValue(val)
    setIsAutoSelectRouteDisabled(false)
  }

  useEffect(() => {
    if (
      searchParams.get('address') &&
      searchParams.get('chainId') &&
      !!portfolio?.isReadyToVisualize &&
      (sessionIds || []).includes(sessionId)
    ) {
      const tokenToSelectOnInit = portfolio.tokens.find(
        (t) =>
          t.address === searchParams.get('address') &&
          t.chainId.toString() === searchParams.get('chainId') &&
          getIsTokenEligibleForSwapAndBridge(t)
      )

      if (tokenToSelectOnInit) {
        dispatch({
          type: 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_FORM',
          params: { fromSelectedToken: tokenToSelectOnInit }
        })
        // Reset search params once updated in the state
        setSearchParams((prev) => {
          prev.delete('address')
          prev.delete('chainId')
          return prev
        })
      }
    }
  }, [
    dispatch,
    setSearchParams,
    portfolio?.isReadyToVisualize,
    portfolio.tokens,
    searchParams,
    sessionIds,
    sessionId
  ])

  // init session
  useEffect(() => {
    // Init each session only once
    if (sessionIdsRequestedToBeInit.current.includes(sessionId)) return

    dispatch({ type: 'SWAP_AND_BRIDGE_CONTROLLER_INIT_FORM', params: { sessionId } })
    sessionIdsRequestedToBeInit.current.push(sessionId)
    setSearchParams((prev) => {
      prev.set('sessionId', sessionId)
      return prev
    })
  }, [dispatch, sessionId, sessionIdsRequestedToBeInit, setSearchParams])

  // remove session - this will be triggered only
  // when navigation to another screen internally in the extension
  // the session removal when the window is forcefully closed is handled
  // in the port.onDisconnect callback in the background
  useEffect(() => {
    return () => {
      dispatch({ type: 'SWAP_AND_BRIDGE_CONTROLLER_UNLOAD_SCREEN', params: { sessionId } })
    }
  }, [dispatch, sessionId])

  useEffect(() => {
    if (
      fromAmountFieldMode === 'fiat' &&
      prevFromAmountInFiat !== fromAmountInFiat &&
      fromAmountInFiat !== fromAmountValue
    ) {
      handleSetFromAmount(fromAmountInFiat)
    }
  }, [fromAmountInFiat, fromAmountValue, prevFromAmountInFiat, fromAmountFieldMode])

  useEffect(() => {
    if (fromAmountFieldMode === 'token') handleSetFromAmount(fromAmount)
    if (fromAmountFieldMode === 'fiat') handleSetFromAmount(fromAmountInFiat)
  }, [fromAmountFieldMode, fromAmount, fromAmountInFiat])

  useEffect(() => {
    if (
      fromAmountFieldMode === 'token' &&
      prevFromAmount !== fromAmount &&
      fromAmount !== fromAmountValue
    ) {
      handleSetFromAmount(fromAmount)
    }
  }, [fromAmount, fromAmountValue, prevFromAmount, fromAmountFieldMode])

  const onFromAmountChange = useCallback(
    (value: string) => {
      handleSetFromAmount(value)
      dispatch({
        type: 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_FORM',
        params: { fromAmount: value }
      })
    },
    [dispatch]
  )

  useEffect(() => {
    if (
      followUpTransactionConfirmed &&
      (formStatus !== SwapAndBridgeFormStatus.ReadyToSubmit || updateQuoteStatus === 'LOADING')
    ) {
      setFollowUpTransactionConfirmed(false)
    }
  }, [followUpTransactionConfirmed, formStatus, updateQuoteStatus])

  const {
    options: fromTokenOptions,
    value: fromTokenValue,
    amountSelectDisabled: fromTokenAmountSelectDisabled
  } = useGetTokenSelectProps({
    tokens: portfolioTokenList,
    token: fromSelectedToken ? getTokenId(fromSelectedToken, networks) : '',
    isLoading: isTokenListLoading,
    networks,
    supportedChainIds
  })

  const handleChangeFromToken = useCallback(
    ({ value }: SelectValue) => {
      const tokenToSelect = portfolioTokenList.find(
        (tokenRes: TokenResult) => getTokenId(tokenRes, networks) === value
      )

      setIsAutoSelectRouteDisabled(false)

      dispatch({
        type: 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_FORM',
        params: { fromSelectedToken: tokenToSelect }
      })
    },
    [dispatch, portfolioTokenList, networks]
  )

  const {
    options: toTokenOptions,
    value: toTokenValue,
    amountSelectDisabled: toTokenAmountSelectDisabled
  } = useGetTokenSelectProps({
    tokens: toTokenList,
    token: toSelectedToken ? getTokenId(toSelectedToken, networks) : '',
    networks,
    supportedChainIds,
    isLoading: !toTokenList.length && updateToTokenListStatus !== 'INITIAL',
    isToToken: true
  })

  const handleChangeToToken = useCallback(
    ({ value }: SelectValue) => {
      const tokenToSelect = toTokenList.find(
        (t: SwapAndBridgeToToken) => getTokenId(t, networks) === value
      )

      setIsAutoSelectRouteDisabled(false)

      dispatch({
        type: 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_FORM',
        params: { toSelectedToken: tokenToSelect }
      })
    },
    [dispatch, toTokenList, networks]
  )

  const handleAddToTokenByAddress = useCallback(
    (searchTerm: string) => {
      const isValidTokenAddress = isAddress(searchTerm)
      if (!isValidTokenAddress) return

      dispatch({
        type: 'SWAP_AND_BRIDGE_CONTROLLER_ADD_TO_TOKEN_BY_ADDRESS',
        params: { address: searchTerm }
      })
    },
    [dispatch]
  )

  const toNetworksOptions: SelectValue[] = useMemo(
    () =>
      networks.map((n) => {
        const tooltipId = `network-${n.chainId}-not-supported-tooltip`
        const isNetworkSupported = getIsNetworkSupported(supportedChainIds, n)

        return {
          value: String(n.chainId),
          extraSearchProps: [n.name],
          disabled: !isNetworkSupported,
          label: (
            <>
              <Text
                fontSize={14}
                weight="medium"
                dataSet={{ tooltipId }}
                style={flexbox.flex1}
                numberOfLines={1}
              >
                {n.name}
              </Text>
              {!isNetworkSupported && (
                <NotSupportedNetworkTooltip tooltipId={tooltipId} network={n} />
              )}
            </>
          ),
          icon: (
            <NetworkIcon
              key={n.chainId.toString()}
              id={n.chainId.toString()}
              style={{ backgroundColor: theme.primaryBackground }}
              size={18}
            />
          )
        }
      }),
    [networks, supportedChainIds, theme.primaryBackground]
  )

  const getToNetworkSelectValue = useMemo(() => {
    const network = networks.find((n) => Number(n.chainId) === toChainId)
    if (!network) return toNetworksOptions[0]

    return toNetworksOptions.filter((opt) => opt.value === String(network.chainId))[0]
  }, [networks, toChainId, toNetworksOptions])

  const handleSetToNetworkValue = useCallback(
    (networkOption: SelectValue) => {
      dispatch({
        type: 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_FORM',
        params: {
          toChainId: networks.filter((n) => String(n.chainId) === networkOption.value)[0].chainId
        }
      })
    },
    [networks, dispatch]
  )

  const handleSwitchFromAmountFieldMode = useCallback(() => {
    dispatch({
      type: 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_FORM',
      params: { fromAmountFieldMode: fromAmountFieldMode === 'token' ? 'fiat' : 'token' }
    })
  }, [fromAmountFieldMode, dispatch])

  const handleSwitchFromAndToTokens = useCallback(
    () =>
      dispatch({
        type: 'SWAP_AND_BRIDGE_CONTROLLER_SWITCH_FROM_AND_TO_TOKENS'
      }),
    [dispatch]
  )

  const handleSetMaxFromAmount = useCallback(() => {
    dispatch({
      type: 'SWAP_AND_BRIDGE_CONTROLLER_UPDATE_FORM',
      params: { fromAmount: fromAmountFieldMode === 'token' ? maxFromAmount : maxFromAmountInFiat }
    })
  }, [fromAmountFieldMode, maxFromAmount, maxFromAmountInFiat, dispatch])

  const formattedToAmount = useMemo(() => {
    if (!quote || !quote.selectedRoute || !quote?.toAsset?.decimals) return '0'

    return `${formatDecimals(
      Number(formatUnits(quote.selectedRoute.toAmount, quote.toAsset.decimals)),
      'precise'
    )}`
  }, [quote])

  const shouldConfirmFollowUpTransactions = useMemo(() => {
    if (!quote?.selectedRoute) return false

    if (quote.selectedRoute.isOnlySwapRoute) return false

    const stepTypes = quote.selectedRouteSteps.map((s) => s.type)

    return (
      stepTypes.includes('middleware') &&
      stepTypes.includes('swap') &&
      formStatus === SwapAndBridgeFormStatus.ReadyToSubmit
    )
  }, [quote, formStatus])

  const highPriceImpactInPercentage = useMemo(() => {
    if (updateQuoteStatus === 'LOADING') return null

    if (formStatus !== SwapAndBridgeFormStatus.ReadyToSubmit) return null

    if (!quote || !quote.selectedRoute) return null

    let inputValueInUsd = 0

    try {
      inputValueInUsd = Number(fromAmountInFiat)
    } catch (error) {
      // silent fail
    }
    if (!inputValueInUsd) return null

    if (inputValueInUsd <= quote.selectedRoute.outputValueInUsd) return null

    if (!fromSelectedToken) return null

    try {
      const sanitizedFromAmount = getSanitizedAmount(fromAmount, fromSelectedToken!.decimals)

      const bigintFromAmount = parseUnits(sanitizedFromAmount, fromSelectedToken!.decimals)

      if (bigintFromAmount !== BigInt(quote.selectedRoute.fromAmount)) return null

      const difference = Math.abs(inputValueInUsd - quote.selectedRoute.outputValueInUsd)

      const percentageDiff = (difference / inputValueInUsd) * 100

      // show the warning banner only if the percentage diff is higher than 5%
      return percentageDiff < 5 ? null : percentageDiff
    } catch (error) {
      return null
    }
  }, [quote, formStatus, fromAmount, fromAmountInFiat, fromSelectedToken, updateQuoteStatus])

  const acknowledgeHighPriceImpact = useCallback(() => {
    closePriceImpactModal()
    openEstimationModal()
  }, [closePriceImpactModal, openEstimationModal])

  const handleSubmitForm = useCallback(
    (isOneClickMode: boolean) => {
      if (highPriceImpactInPercentage) {
        openPriceImpactModal()
        return
      }
      if (!quote || !quote.selectedRoute) return

      // open the estimation modal on one click method;
      // build/add a swap user request on batch
      if (isOneClickMode) {
        openEstimationModal()
      } else {
        dispatch({
          type: 'SWAP_AND_BRIDGE_CONTROLLER_BUILD_USER_REQUEST'
        })
      }
    },
    [dispatch, highPriceImpactInPercentage, openEstimationModal, openPriceImpactModal, quote]
  )

  /**
   * @deprecated - the settings menu is not used anymore
   */
  const handleToggleSettingsMenu = useCallback(() => {
    setSettingsModalVisible((p) => !p)
  }, [])

  const pendingRoutes = useMemo(() => {
    return (
      (activeRoutes || [])
        .filter((r) => r.route && getAddress(r.route.userAddress) === account?.addr)
        .reverse() || []
    )
  }, [activeRoutes, account])

  return {
    sessionId,
    fromAmountValue,
    onFromAmountChange,
    fromTokenAmountSelectDisabled,
    fromTokenOptions,
    fromTokenValue,
    handleChangeFromToken,
    toNetworksOptions,
    getToNetworkSelectValue,
    handleSetToNetworkValue,
    toTokenAmountSelectDisabled,
    toTokenOptions,
    toTokenValue,
    handleAddToTokenByAddress,
    handleChangeToToken,
    handleSwitchFromAmountFieldMode,
    handleSetMaxFromAmount,
    handleSubmitForm,
    formattedToAmount,
    shouldConfirmFollowUpTransactions,
    followUpTransactionConfirmed,
    setFollowUpTransactionConfirmed,
    highPriceImpactInPercentage,
    priceImpactModalRef,
    closePriceImpactModal,
    acknowledgeHighPriceImpact,
    settingModalVisible,
    handleToggleSettingsMenu,
    handleSwitchFromAndToTokens,
    pendingRoutes,
    routesModalRef,
    openRoutesModal,
    closeRoutesModal,
    estimationModalRef,
    closeEstimationModal,
    isAutoSelectRouteDisabled,
    setIsAutoSelectRouteDisabled,
    isOneClickModeAllowed
  }
}

export default useSwapAndBridgeForm
