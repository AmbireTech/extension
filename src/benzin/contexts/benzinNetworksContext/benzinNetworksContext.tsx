import React, { createContext, FC, useCallback, useMemo, useState } from 'react'

import { ChainlistNetwork, Network } from '@ambire-common/interfaces/network'
import { convertToAmbireNetworkFormat } from '@ambire-common/utils/networks'
import { buildTimeNetworks } from '@benzin/constants/networks'

const fetch = window.fetch.bind(window) as any

type Props = {
  children: React.ReactNode
}
type NetworksContextType = {
  benzinNetworks: Network[]
  addNetwork: (chainId: bigint) => void
  loadingBenzinNetworks: bigint[]
  notFoundNetworks: bigint[]
}

const benzinNetworksContext = createContext<NetworksContextType>({
  benzinNetworks: [],
  addNetwork: () => {},
  loadingBenzinNetworks: [],
  notFoundNetworks: []
})

const fetchNetworkData = async (chainId: bigint) => {
  const chainsRequest = await fetch('https://chainid.network/chains.json')
  const chains = await chainsRequest.json()

  const networkDataInChainlistNetworkFormat = chains.find(
    (chainlistNetwork: ChainlistNetwork) => chainlistNetwork.chainId === Number(chainId)
  )

  if (!networkDataInChainlistNetworkFormat) return

  const networkDataInAmbireNetworkFormat = await convertToAmbireNetworkFormat(
    networkDataInChainlistNetworkFormat
  )

  return networkDataInAmbireNetworkFormat
}

const BenzinNetworksContextProvider: FC<Props> = ({ children }) => {
  const [benzinNetworks, setBenzinNetworks] = useState<Network[]>(buildTimeNetworks)
  const [loadingBenzinNetworks, setLoadingBenzinNetworks] = useState<bigint[]>([])
  const [notFoundNetworks, setNotFoundNetworks] = useState<bigint[]>([])

  const addNetwork = useCallback(
    async (chainId: bigint) => {
      if (loadingBenzinNetworks.includes(chainId) || notFoundNetworks.includes(chainId)) return

      setLoadingBenzinNetworks((prevLoadingNetworks) => [...prevLoadingNetworks, chainId])
      try {
        const networkExists = benzinNetworks.some((network) => network.chainId === chainId)
        if (networkExists) {
          setNotFoundNetworks((prev) => [...prev, chainId])
          return
        }

        const networkData = await fetchNetworkData(chainId)

        if (!networkData) {
          setNotFoundNetworks((prev) => [...prev, chainId])
          return
        }

        setBenzinNetworks((prevNetworks) => [...prevNetworks, networkData])
      } catch (error) {
        setNotFoundNetworks((prev) => [...prev, chainId])
        console.error(error)
      } finally {
        setLoadingBenzinNetworks((prevLoadingNetworks) =>
          prevLoadingNetworks.filter((loadingChainId) => loadingChainId !== chainId)
        )
      }
    },
    [loadingBenzinNetworks, notFoundNetworks, benzinNetworks]
  )

  const value = useMemo(
    () => ({
      benzinNetworks,
      addNetwork,
      notFoundNetworks,
      loadingBenzinNetworks
    }),
    [benzinNetworks, addNetwork, notFoundNetworks, loadingBenzinNetworks]
  )

  return <benzinNetworksContext.Provider value={value}>{children}</benzinNetworksContext.Provider>
}

export { benzinNetworksContext, BenzinNetworksContextProvider }
