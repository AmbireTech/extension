import networks from 'ambire-common/src/constants/networks'
import useNetwork, { UseNetworkReturnType } from 'ambire-common/src/hooks/useNetwork'
import React, { createContext, useMemo } from 'react'

import useStorage from '@modules/common/hooks/useStorage'

const defaultNetwork = 'ethereum'

const NetworkContext = createContext<UseNetworkReturnType>({
  setNetwork: () => {},
  network: networks.find((n) => n.id === defaultNetwork)
})

const NetworkProvider: React.FC = ({ children }) => {
  const { setNetwork, network } = useNetwork({
    useStorage
  })

  return (
    <NetworkContext.Provider
      value={useMemo(
        () => ({
          setNetwork,
          network
        }),
        [setNetwork, network]
      )}
    >
      {children}
    </NetworkContext.Provider>
  )
}

export { NetworkContext, NetworkProvider }
