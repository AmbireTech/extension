import Fuse from 'fuse.js'
import React, { useMemo } from 'react'
import { View } from 'react-native'

import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import spacings from '@common/styles/spacings'
import { compareChainIdsByBalance } from '@common/utils/sorting'

import NetworkComponent from './Network'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

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
  const { state: networks } = useController('NetworksController', selectNetworks)
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
      .sort((a, b) => compareChainIdsByBalance(a, b, portfolio.balancePerNetwork))

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
