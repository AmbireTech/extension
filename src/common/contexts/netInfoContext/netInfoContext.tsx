import React, { createContext, useMemo } from 'react'

import { useNetInfo as RnUseNetInfo } from '@react-native-community/netinfo'

import { ConnectionStates, netInfoContextDefaults, NetInfoContextReturnType } from './types'

const NetInfoContext = createContext<NetInfoContextReturnType>(netInfoContextDefaults)

const checkIsConnected = (isConnected: boolean | null): ConnectionStates => {
  if (isConnected === null || typeof isConnected !== 'boolean') {
    return ConnectionStates.LOADING
  }

  return isConnected ? ConnectionStates.CONNECTED : ConnectionStates.NOT_CONNECTED
}

const NetInfoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isConnected } = RnUseNetInfo()

  const connectionState = checkIsConnected(isConnected)

  return (
    <NetInfoContext.Provider value={useMemo(() => ({ connectionState }), [connectionState])}>
      {children}
    </NetInfoContext.Provider>
  )
}

export { NetInfoContext, NetInfoProvider, ConnectionStates }
