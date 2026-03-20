import Fuse from 'fuse.js'
import React, { useMemo } from 'react'
import { View } from 'react-native'

import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'

import NetworkComponent from './Network'

const Networks = ({
  openSettingsBottomSheet,
  openBlockExplorer,
  search,
  onPress
}: {
  openSettingsBottomSheet: (chainId: bigint | string) => void
  openBlockExplorer: (url?: string) => void
  search: string
  onPress: (chainId: bigint | string) => void
}) => {
  const { networks } = useController('NetworksController').state
  const {
    state: { account, portfolio }
  } = useController('SelectedAccountController')

  // Use this map to avoid searching the network name for every network using find
  const networkChainIdToNameMap = useMemo(() => {
    const map: { [chainId: string]: string } = {}
    networks.forEach((network) => {
      map[network.chainId.toString()] = network.name
    })
    return map
  }, [networks])

  const filteredAndSortedPortfolio = useMemo(() => {
    const nonInternalNetworks = Object.keys(portfolio.balancePerNetwork || [])
      .filter((chainId) => {
        const name = networkChainIdToNameMap[chainId]

        // Done to filter out internal networks
        return !!name
      })
      .sort((a, b) => {
        const aBalance = portfolio.balancePerNetwork[a]
        const bBalance = portfolio.balancePerNetwork[b]

        return Number(bBalance) - Number(aBalance)
      })

    if (!search) {
      return nonInternalNetworks
    }

    const fuse = new Fuse(
      nonInternalNetworks.map((chainId) => ({
        chainId,
        name: networkChainIdToNameMap[chainId]
      })),
      {
        keys: ['name'],
        threshold: 0.3
      }
    )

    const result = fuse.search(search)

    return result.map(({ item }) => item.chainId)
  }, [networkChainIdToNameMap, portfolio.balancePerNetwork, search])

  return (
    <View style={isWeb ? spacings.mbLg : {}}>
      {!!account &&
        filteredAndSortedPortfolio.map((chainId) => (
          <NetworkComponent
            key={chainId}
            chainId={chainId}
            openBlockExplorer={openBlockExplorer}
            openSettingsBottomSheet={openSettingsBottomSheet}
            onPress={onPress}
          />
        ))}
    </View>
  )
}

export default React.memo(Networks)
