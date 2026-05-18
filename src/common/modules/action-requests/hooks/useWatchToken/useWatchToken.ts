import { getAddress } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { getNetworksWithFailedRPC } from '@ambire-common/libs/networks/networks'
import useController from '@common/hooks/useController'
import {
  getTokenEligibility,
  getTokenFromPortfolio,
  getTokenFromTemporaryTokens,
  handleTokenIsInPortfolio,
  selectNetwork
} from '@common/modules/action-requests/utils/watchTokenRequest'
import getAndFormatTokenDetails from '@common/modules/dashboard/helpers/getTokenDetails'

const useWatchToken = () => {
  const {
    state: { currentUserRequest },
    dispatch: requestsDispatch
  } = useController('RequestsController')
  const {
    state: { temporaryTokens, validTokens, customTokens },
    dispatch: portfolioDispatch
  } = useController('PortfolioController')
  const {
    state: { portfolio: selectedAccountPortfolio, account }
  } = useController('SelectedAccountController')
  const { networks } = useController('NetworksController').state
  const { state } = useController('ProvidersController')

  const userRequest = useMemo(
    () => (currentUserRequest?.kind === 'walletWatchAsset' ? currentUserRequest : undefined),
    [currentUserRequest]
  )

  // TODO: fix types here
  const tokenData = userRequest?.meta.params.options as any
  const origin = userRequest?.dappPromises[0].session.origin
  const network =
    networks.find((n) => n.explorerUrl === origin) ||
    networks.find((n) => n.chainId === tokenData?.chainId)
  const [showAlreadyInPortfolioMessage, setShowAlreadyInPortfolioMessage] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(true)
  const [tokenNetwork, setTokenNetwork] = useState(network)
  const [isTemporaryTokenRequested, setTemporaryTokenRequested] = useState(false)

  const networkWithFailedRPC =
    tokenNetwork?.chainId &&
    getNetworksWithFailedRPC({ providers: state.providers }).filter(
      (chainId: string) => tokenNetwork?.chainId.toString() === chainId
    )

  const tokenTypeEligibility = useMemo(
    () => getTokenEligibility(tokenData, validTokens, tokenNetwork),
    [validTokens, tokenData, tokenNetwork]
  )

  const tokenValidation = useMemo(() => {
    if (!tokenData?.address || !tokenNetwork) return null
    return validTokens.erc20[`${tokenData.address}-${tokenNetwork.chainId}`]
  }, [validTokens, tokenData?.address, tokenNetwork])

  const tokenValidationError = useMemo(() => {
    if (!tokenData?.address) return null

    if (tokenNetwork?.chainId) {
      return validTokens.erc20[`${tokenData.address}-${tokenNetwork.chainId}`]?.error
    }

    // When we don't have tokenNetwork.chainId, find any validation error for this address across all networks
    const validationEntry = Object.entries(validTokens.erc20 || {}).find(([key]) =>
      key.startsWith(`${tokenData.address}-`)
    )

    return (validationEntry?.[1] as any)?.error
  }, [validTokens, tokenData?.address, tokenNetwork?.chainId])

  const handleCancel = useCallback(() => {
    if (!userRequest) return

    requestsDispatch({
      type: 'method',
      params: {
        method: 'rejectUserRequests',
        args: ['User rejected the request.', [userRequest.id]]
      }
    })
  }, [userRequest, requestsDispatch])

  // Handle the case its already in token preferences
  const isTokenCustom = !!customTokens.find(
    (token) =>
      token.address.toLowerCase() === tokenData?.address.toLowerCase() &&
      token.chainId === tokenNetwork?.chainId
  )

  const temporaryToken = useMemo(
    () => getTokenFromTemporaryTokens(temporaryTokens, tokenData, tokenNetwork),
    [temporaryTokens, tokenData, tokenNetwork]
  )

  const portfolioToken = useMemo(
    () => getTokenFromPortfolio(tokenData, tokenNetwork, selectedAccountPortfolio),
    [selectedAccountPortfolio, tokenNetwork, tokenData]
  )

  const handleTokenType = (chainId: bigint) => {
    if (!account) return

    portfolioDispatch({
      type: 'method',
      params: {
        method: 'updateTokenValidationByStandard',
        args: [{ address: tokenData?.address, chainId }, account.addr, false]
      }
    })
  }

  const handleSelectNetwork = useCallback(async () => {
    await selectNetwork(
      network,
      tokenNetwork,
      tokenData,
      networks,
      validTokens,
      setIsLoading,
      setTokenNetwork,
      handleTokenType,
      state.providers
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    network,
    tokenNetwork,
    tokenData,
    networks,
    validTokens,
    setIsLoading,
    setTokenNetwork,
    handleTokenType,
    state.providers,
    tokenTypeEligibility
  ])

  useEffect(() => {
    const handleEffect = async () => {
      handleSelectNetwork()
      if (tokenNetwork) {
        // Check if token is already in portfolio
        const isTokenInHints = await handleTokenIsInPortfolio(
          isTokenCustom,
          selectedAccountPortfolio,
          tokenNetwork,
          tokenData
        )
        if (isTokenInHints) {
          setIsLoading(false)
          setShowAlreadyInPortfolioMessage(true)
        }
        if (!temporaryToken) {
          // Check if token is eligible to add in portfolio
          if (tokenData && (!tokenTypeEligibility || tokenValidation?.error)) {
            handleTokenType(tokenNetwork?.chainId)
          }

          if (tokenTypeEligibility && !isTokenInHints && !isTemporaryTokenRequested) {
            setTemporaryTokenRequested(true)
            if (!account) return

            portfolioDispatch({
              type: 'method',
              params: {
                method: 'getTemporaryTokens',
                args: [account.addr, tokenNetwork?.chainId, getAddress(tokenData?.address)]
              }
            })
          }
        }

        // Stop loading if there's a validation error
        if (tokenValidation?.error) {
          setIsLoading(false)
        }
      }
    }

    handleEffect().catch((error) => {
      // eslint-disable-next-line no-console
      console.error(error)
      return setIsLoading(false)
    })

    if (tokenTypeEligibility === false || !!temporaryToken || tokenValidation?.error) {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    network,
    tokenData,
    tokenNetwork,
    networks,
    tokenTypeEligibility,
    temporaryToken,
    isTokenCustom,
    selectedAccountPortfolio,
    validTokens
  ])

  const handleAddToken = useCallback(async () => {
    if (!userRequest) return
    if (!tokenNetwork?.chainId) return
    if (!account) return

    // Only add if temporaryToken exists (like AddTokenBottomSheet does), to avoid adding tokens with
    // missing/invalid info (e.g. decimals) that would cause issues in the portfolio
    if (!temporaryToken?.address || !temporaryToken?.symbol || !temporaryToken?.decimals) {
      return
    }

    portfolioDispatch({
      type: 'method',
      params: {
        method: 'addCustomToken',
        args: [
          {
            address: temporaryToken.address,
            standard: 'ERC20',
            chainId: tokenNetwork?.chainId
          },
          account.addr,
          true
        ]
      }
    })

    requestsDispatch({
      type: 'method',
      params: {
        method: 'resolveUserRequest',
        args: [null, userRequest.id]
      }
    })
  }, [requestsDispatch, portfolioDispatch, userRequest, temporaryToken, tokenNetwork, account])

  const tokenDetails = useMemo(() => {
    const token = portfolioToken || temporaryToken

    return token && token?.flags && getAndFormatTokenDetails(token, networks)
  }, [temporaryToken, portfolioToken, networks])

  return {
    userRequest,
    tokenData,
    tokenNetwork,
    isLoading,
    setIsLoading,
    showAlreadyInPortfolioMessage,
    networkWithFailedRPC,
    tokenTypeEligibility,
    tokenValidation,
    tokenValidationError,
    handleCancel,
    isTokenCustom,
    temporaryToken,
    portfolioToken,
    handleAddToken,
    tokenDetails
  }
}

export default useWatchToken
