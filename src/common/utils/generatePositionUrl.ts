/**
 * Maps chain IDs to protocol-specific chain names
 * Each protocol may have different naming conventions for chains
 */
const CHAIN_ID_TO_UNISWAP_CHAIN: { [key: string]: string } = {
  '1': 'ethereum',
  '137': 'polygon',
  '196': 'xlayer',
  '143': 'monad',
  '42161': 'arbitrum',
  '10': 'optimism',
  '8453': 'base',
  '324': 'zksync',
  '480': 'worldchain',
  '1868': 'soneium',
  '7777777': 'zora',
  '42220': 'celo',
  '81457': 'blast',
  '43114': 'avalanche',
  '56': 'bnb',
  '59144': 'linea'
}

interface GeneratePositionUrlParams {
  providerName: string
  positionId?: string
  chainId?: bigint
  siteUrl?: string
}

/**
 * Generates a protocol-specific URL for a DeFi position
 * Currently supports Uniswap V3 and V4. Can be extended for other protocols.
 * @param params - Configuration object with provider name, position ID, chain ID, and site URL
 * @returns The generated position URL, or undefined if it can't be generated
 */
export const generatePositionUrl = ({
  providerName,
  positionId,
  chainId,
  siteUrl
}: GeneratePositionUrlParams): string | undefined => {
  if (!siteUrl || !positionId) return undefined

  let origin: string
  try {
    origin = new URL(siteUrl).origin
  } catch {
    return undefined
  }

  const normalizedProviderName = providerName.toLowerCase()
  const isUniswapV3 =
    normalizedProviderName.includes('uniswap v3') ||
    (normalizedProviderName.includes('uniswap') && normalizedProviderName.includes('v3'))
  const isUniswapV4 =
    normalizedProviderName.includes('uniswap v4') ||
    (normalizedProviderName.includes('uniswap') && normalizedProviderName.includes('v4'))

  // Uniswap V3/V4 specific URL generation
  if (isUniswapV3 || isUniswapV4) {
    const uniswapVersion = isUniswapV4 ? 'v4' : 'v3'

    if (!chainId) return undefined

    const chainIdStr = chainId.toString()
    const uniswapChainName = CHAIN_ID_TO_UNISWAP_CHAIN[chainIdStr]

    if (!uniswapChainName) {
      console.warn(
        `Unsupported chain ID for Uniswap ${uniswapVersion.toUpperCase()}: ${chainIdStr}`
      )
      return undefined
    }

    return `${origin}/positions/${uniswapVersion}/${uniswapChainName}/${positionId}`
  }

  // Default: just return siteUrl if we can't build a specific URL
  return undefined
}
