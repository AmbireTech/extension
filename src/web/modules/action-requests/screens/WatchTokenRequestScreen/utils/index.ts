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
    const validTokenNetworks = networks.filter(
      (_network: Network) =>
        validTokens.erc20[`${tokenData?.address}-${_network.chainId}`] === true &&
        `${tokenData?.address}-${_network.chainId}` in validTokens.erc20
    )
    const allNetworksChecked = networks.every(
      (_network: Network) =>
        `${tokenData?.address}-${_network.chainId}` in validTokens.erc20 &&
        providers[_network.chainId.toString()].isWorking
    )

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
      await Promise.all(
        networks.map(
          (_network: Network) =>
            providers[_network.chainId.toString()].isWorking && handleTokenType(_network.chainId)
        )
      )
    }
  }
}

const getTokenEligibility = (
  tokenData: { address: string } | CustomToken,
  validTokens: any,
  tokenNetwork: Network | undefined
) =>
  null ||
  (tokenData?.address &&
    tokenNetwork?.chainId &&
    validTokens?.erc20[`${tokenData?.address}-${tokenNetwork?.chainId}`] &&
    validTokens?.erc20[`${tokenData?.address}-${tokenNetwork?.chainId}`]?.isValid === true)

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
) =>
  undefined ||
  (tokenData &&
    tokenData.address &&
    tokenNetwork &&
    temporaryTokens?.[tokenNetwork.chainId.toString()] &&
    temporaryTokens?.[tokenNetwork.chainId.toString()]?.result?.tokens?.find(
      (x) => x.address.toLowerCase() === tokenData.address.toLowerCase()
    ))

export {
  selectNetwork,
  handleTokenIsInPortfolio,
  getTokenEligibility,
  getTokenFromTemporaryTokens,
  getTokenFromPortfolio
}
