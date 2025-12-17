import { ZeroAddress } from 'ethers'

import { Network } from '@ambire-common/interfaces/network'
import { RPCProviders } from '@ambire-common/interfaces/provider'
import { SelectedAccountPortfolio } from '@ambire-common/interfaces/selectedAccount'
import { CustomToken } from '@ambire-common/libs/portfolio/customToken'
import { TemporaryTokens } from '@ambire-common/libs/portfolio/interfaces'
import { TokenData } from '@web/modules/action-requests/screens/WatchTokenRequestScreen/WatchTokenRequestScreen' // Polygon MATIC token address

const selectNetwork = async (
  network: Network | undefined,
  tokenNetwork: Network | undefined,
  tokenData: TokenData,
  networks: Network[],
  validTokens: any,
  setIsLoading: (isLoading: boolean) => void,
  setTokenNetwork: (network: Network) => void,
  handleTokenType: (chainId: bigint) => void,
  providers: RPCProviders
) => {
  if (!network && !tokenNetwork?.chainId) {
    const validTokenNetworks = networks.filter((_network: Network) => {
      const key = `${tokenData?.address}-${_network.chainId}`
      const isValid = validTokens.erc20[key]?.isValid === true

      return isValid
    })

    const allNetworksChecked = networks.every((_network: Network) => {
      const key = `${tokenData?.address}-${_network.chainId}`
      const hasKey = key in validTokens.erc20
      const isWorking = providers[_network.chainId.toString()]?.isWorking
      const hasError = validTokens.erc20[key]?.error || validTokens.erc20[key] === false

      // Exclude networks with errors from being considered "checked" - we skip them entirely
      if (hasError) {
        return true // Consider as "checked" but excluded from validation
      }

      const isChecked = hasKey || !isWorking

      // Treat networks with errors as "processed" so they don't block allNetworksChecked,
      // but skip them from further validation/selection logic.
      return isChecked
    })

    if (validTokenNetworks.length > 0) {
      const newTokenNetwork = validTokenNetworks.find(
        (_network: Network) => _network.chainId !== tokenNetwork?.chainId
      )
      if (newTokenNetwork) {
        setTokenNetwork(newTokenNetwork)
      }
    } else if (allNetworksChecked && validTokenNetworks.length === 0) {
      setIsLoading(false)
    } else {
      // Get networks that haven't been tried yet and have working providers
      const untried = networks.filter((_network: Network) => {
        const key = `${tokenData?.address}-${_network.chainId}`
        const hasKey = key in validTokens.erc20
        const isWorking = providers[_network.chainId.toString()]?.isWorking
        const hasError = validTokens.erc20[key]?.error || validTokens.erc20[key] === false

        // Only include networks that: are working, haven't been tried, and don't have errors
        return isWorking && !hasKey && !hasError
      })

      const targetNetwork = tokenNetwork || untried[0]

      if (targetNetwork && providers[targetNetwork.chainId.toString()]?.isWorking) {
        handleTokenType(targetNetwork.chainId)
      } else {
        setIsLoading(false)
      }
    }
  } else {
    // Network already set or tokenNetwork has chainId - skip selection
  }
}

const getTokenEligibility = (
  tokenData: { address: string } | CustomToken,
  validTokens: any,
  tokenNetwork: Network | undefined
) => {
  if (!tokenData?.address || !tokenNetwork?.chainId || !validTokens?.erc20) {
    return undefined
  }

  const key = `${tokenData.address}-${tokenNetwork.chainId}`
  const tokenValidation = validTokens.erc20[key]

  return tokenValidation === true || tokenValidation?.isValid === true || undefined
}

const handleTokenIsInPortfolio = async (
  isTokenCustom: boolean,
  accountPortfolio: SelectedAccountPortfolio | null,
  tokenNetwork: Network,
  tokenData: { address: string } | CustomToken
) => {
  const isTokenInHints =
    isTokenCustom ||
    accountPortfolio?.tokens.find(
      (_t) =>
        _t.address.toLowerCase() === tokenData?.address.toLowerCase() &&
        _t.chainId === tokenNetwork?.chainId &&
        _t.amount > 0n
    )

  const isNative = tokenData?.address === ZeroAddress

  return isTokenInHints || isTokenCustom || isNative
}

const getTokenFromPortfolio = (
  tokenData: { address: string },
  tokenNetwork: Network | undefined,
  accountPortfolio: SelectedAccountPortfolio | null
) => {
  if (!tokenData || !tokenData.address) return null

  return accountPortfolio?.tokens?.find(
    (token) =>
      token.address.toLowerCase() === tokenData?.address.toLowerCase() &&
      token.chainId === tokenNetwork?.chainId
  )
}

const getTokenFromTemporaryTokens = (
  temporaryTokens: TemporaryTokens,
  tokenData: { address: string } | CustomToken,
  tokenNetwork: Network | undefined
) => {
  if (!tokenData?.address || !tokenNetwork?.chainId || !temporaryTokens) {
    return undefined
  }

  const chainTokens = temporaryTokens[tokenNetwork.chainId.toString()]
  if (!chainTokens?.result?.tokens) {
    return undefined
  }

  return chainTokens.result.tokens.find(
    (token) => token.address.toLowerCase() === tokenData.address.toLowerCase()
  )
}

export {
  selectNetwork,
  handleTokenIsInPortfolio,
  getTokenEligibility,
  getTokenFromTemporaryTokens,
  getTokenFromPortfolio
}
