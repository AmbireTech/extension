import React, { useMemo } from 'react'
import { View } from 'react-native'

import { NetworkId } from '@ambire-common/interfaces/network'
import spacings from '@common/styles/spacings'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'

import NetworkComponent from './Network'

const Networks = ({
  openSettingsBottomSheet,
  openBlockExplorer,
  filterByNetworkId,
  search
}: {
  openSettingsBottomSheet: (networkId: NetworkId) => void
  openBlockExplorer: (url?: string) => void
  filterByNetworkId: NetworkId | null
  search: string
}) => {
  const { networks } = useNetworksControllerState()
  const { selectedAccount } = useAccountsControllerState()
  const portfolioControllerState = usePortfolioControllerState()

  const portfolioByNetworks = useMemo(
    () => (selectedAccount ? portfolioControllerState.state.latest[selectedAccount] : {}),
    [selectedAccount, portfolioControllerState.state.latest]
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
      {!!selectedAccount &&
        filteredAndSortedPortfolio.map((networkId) => (
          <NetworkComponent
            key={networkId}
            networkId={networkId}
            filterByNetworkId={filterByNetworkId}
            openBlockExplorer={openBlockExplorer}
            openSettingsBottomSheet={openSettingsBottomSheet}
          />
        ))}
    </View>
  )
}

export default Networks
