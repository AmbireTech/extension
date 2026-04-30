/**
 * Maps chain IDs to protocol-specific chain names
 * Each protocol may have different naming conventions for chains
 */
const CHAIN_ID_TO_UNISWAP_CHAIN: { [key: string]: string } = {
  '1': 'ethereum',
  '137': 'polygon',
  '42161': 'arbitrum',
  '10': 'optimism',
  '8453': 'base',
  '324': 'zksync',
  '250': 'fantom',
  '43114': 'avalanche-c',
  '56': 'bsc',
  '1101': 'zkevm',
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
 * Currently supports Uniswap V3. Can be extended for other protocols.
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

  // Uniswap V3 specific URL generation
  if (
    providerName.includes('Uniswap V3') ||
    (providerName.includes('Uniswap') && providerName.includes('V3'))
  ) {
    if (!chainId) return undefined

    const chainIdStr = chainId.toString()
    const uniswapChainName = CHAIN_ID_TO_UNISWAP_CHAIN[chainIdStr]

    if (!uniswapChainName) {
      console.warn(`Unsupported chain ID for Uniswap V3: ${chainIdStr}`)
      return undefined
    }

    return `${origin}/positions/v3/${uniswapChainName}/${positionId}`
  }

  // Default: just return siteUrl if we can't build a specific URL
  return undefined
}
