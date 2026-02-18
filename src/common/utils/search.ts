import Fuse from 'fuse.js'

import { Network } from '@ambire-common/interfaces/network'
import { TokenResult } from '@ambire-common/libs/portfolio'

const searchWithNetworkName = <T extends object>({
  networks,
  items,
  search,
  keys
}: {
  networks: Network[]
  items: T[]
  search: string
  keys: string[]
}) => {
  if (!search) {
    return items
  }

  // Use this map to avoid searching the network name for every token using find
  const networkChainIdToNameMap: { [chainId: string]: string } = {}

  networks.forEach((network) => {
    networkChainIdToNameMap[network.chainId.toString()] = network.name
  })

  const fuse = new Fuse(
    items.map((item) => ({
      ...item,
      networkName: networkChainIdToNameMap[(item as any).chainId.toString()] || ''
    })),
    {
      keys: [...keys, 'networkName'],
      threshold: 0.3
    }
  )

  const result = fuse.search(search)

  return result.map(({ item }) => item) as T[]
}

const tokenOrCollectionSearch = ({
  networks,
  assets,
  search,
  searchType = 'token'
}: {
  networks: Network[]
  assets: TokenResult[]
  search: string
  searchType?: 'token' | 'collection'
}) => {
  return searchWithNetworkName({
    networks,
    items: assets,
    search,
    keys: searchType === 'token' ? ['symbol', 'address'] : ['name', 'address']
  })
}

export { tokenOrCollectionSearch, searchWithNetworkName }
