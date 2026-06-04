import Fuse from 'fuse.js'
import { useMemo } from 'react'

import { Dapp } from '@ambire-common/interfaces/dapp'
import { Network } from '@ambire-common/interfaces/network'

import { ExploreSectionType } from '../useExploreSections/useExploreSections'

type Args = {
  type: ExploreSectionType
  allDapps: Dapp[]
  recentDapps: Dapp[]
  search: string
  network?: Network | null
  category?: string | null
}

const useExploreFilteredDapps = ({
  type,
  allDapps,
  recentDapps,
  search,
  network,
  category
}: Args): Dapp[] => {
  const sourceDapps = useMemo(() => {
    if (type === 'recent') return recentDapps
    if (type === 'connected') return allDapps.filter((d) => d.isConnected)
    if (type === 'favorites') return allDapps.filter((d) => d.favorite)
    return allDapps
  }, [type, allDapps, recentDapps])

  const searchableDapps = useMemo(
    () =>
      sourceDapps.map((dapp) => ({
        dapp,
        name: dapp.name.toLowerCase(),
        url: dapp.url.toLowerCase(),
        description: dapp.description?.toLowerCase() || ''
      })),
    [sourceDapps]
  )

  return useMemo(() => {
    let dapps = sourceDapps
    if (search) {
      const fuse = new Fuse(searchableDapps, {
        keys: [
          { name: 'name', weight: 0.7 },
          { name: 'url', weight: 0.2 },
          { name: 'description', weight: 0.1 }
        ],
        shouldSort: false,
        threshold: 0.2,
        minMatchCharLength: 1
      })
      dapps = fuse.search(search).map((r) => r.item.dapp)
    }

    // Network + category filters only apply to the "apps" sub-screen.
    if (type !== 'apps') return dapps

    return dapps.filter((dapp) => {
      const networkMatch = !network || dapp.chainIds?.includes(Number(network.chainId))
      const categoryMatch = !category || dapp.category?.toLowerCase() === category.toLowerCase()
      return networkMatch && categoryMatch
    })
  }, [sourceDapps, searchableDapps, search, network, category, type])
}

export default useExploreFilteredDapps
