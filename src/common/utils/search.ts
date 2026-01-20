import Fuse from 'fuse.js'

import { Network } from '@ambire-common/interfaces/network'
import { TokenResult } from '@ambire-common/libs/portfolio'

const tokenSearch = ({
  networks,
  tokens,
  search
}: {
  networks: Network[]
  tokens: TokenResult[]
  search: string
}) => {
  // Use this map to avoid searching the network name for every token using find
  const networkChainIdToNameMap: { [chainId: string]: string } = {}

  networks.forEach((network) => {
    networkChainIdToNameMap[network.chainId.toString()] = network.name
  })

  if (!search) {
    return tokens
  }

  const fuse = new Fuse(
    tokens.map((token) => ({
      ...token,
      networkName: networkChainIdToNameMap[token.chainId.toString()] || ''
    })),
    {
      keys: ['symbol', 'address', 'networkName'],
      threshold: 0.3
    }
  )

  const result = fuse.search(search)

  return result.map(({ item }) => item)
}

export { tokenSearch }
