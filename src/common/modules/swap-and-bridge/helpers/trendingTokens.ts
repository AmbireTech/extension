import { TrendingToken } from '@ambire-common/interfaces/dapp'
import { SupportedNetworks } from '@ambire-common/interfaces/network'
import { SwapAndBridgeToToken } from '@ambire-common/interfaces/swapAndBridge'

/**
 * Narrows the globally trending tokens down to the ones tradable on the currently
 * selected "to" network, and adapts them to the shape the Swap & Bridge token list
 * already renders. Tokens without a resolved contract or decimals (e.g. some native
 * assets, which the trending API reports separately from ERC-20s) are dropped, as
 * there's nothing to build a valid receive-token option from.
 */
export const getTrendingTokensForChain = (
  trendingTokens: TrendingToken[],
  chainId: number | null,
  networks: SupportedNetworks[]
): SwapAndBridgeToToken[] => {
  if (!chainId) return []

  const network = networks.find((n) => Number(n.chainId) === chainId)
  if (!network?.platformId) return []

  return trendingTokens
    .filter(
      (token): token is TrendingToken & { address: string; decimals: number } =>
        token.platformId === network.platformId && !!token.address && token.decimals != null
    )
    .map((token) => ({
      symbol: token.symbol,
      name: token.name,
      chainId,
      address: token.address,
      icon: token.icon,
      decimals: token.decimals,
      priceUSD: String(token.priceUSD)
    }))
}
