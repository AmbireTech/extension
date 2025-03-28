import React, { useMemo } from 'react'
import { View } from 'react-native'

import { NetworkId } from '@ambire-common/interfaces/network'
import spacings from '@common/styles/spacings'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

import NetworkComponent from './Network'

const Networks = ({
  openSettingsBottomSheet,
  openBlockExplorer,
  search,
  onPress
}: {
  openSettingsBottomSheet: (networkId: NetworkId) => void
  openBlockExplorer: (url?: string) => void
  search: string
  onPress: (networkId: NetworkId) => void
}) => {
  const { networks } = useNetworksControllerState()
  const { account, portfolio } = useSelectedAccountControllerState()

  const portfolioByNetworks = useMemo(
    () => (account ? portfolio.latest : {}),
    [account, portfolio.latest]
  )

  const filteredAndSortedPortfolio = useMemo(
    () =>
      Object.keys(portfolioByNetworks || [])
        .filter((networkId) => {
          const { name } = networks.find(({ id }) => id === networkId) || {}

          if (!name) return false

          if (search) {
            return name.toLowerCase().includes(search.toLowerCase())
          }

          return true
        })
        .sort((a, b) => {
          const aBalance = portfolioByNetworks[a]?.result?.total?.usd || 0
          const bBalance = portfolioByNetworks[b]?.result?.total?.usd || 0

          if (aBalance === bBalance) {
            if (b === 'rewards' || b === 'gasTank') return -1
            return 1
          }

          return Number(bBalance) - Number(aBalance)
        }),
    [networks, portfolioByNetworks, search]
  )

  return (
    <View style={spacings.mbLg}>
      {!!account &&
        filteredAndSortedPortfolio.map((networkId) => (
          <NetworkComponent
            key={networkId}
            networkId={networkId}
            openBlockExplorer={openBlockExplorer}
            openSettingsBottomSheet={openSettingsBottomSheet}
            onPress={onPress}
          />
        ))}
    </View>
  )
}

export default React.memo(Networks)
