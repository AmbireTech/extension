import React, { createContext } from 'react'

import { ConnectionStates, netInfoContextDefaults, NetInfoContextReturnType } from './types'

const NetInfoContext = createContext<NetInfoContextReturnType>(netInfoContextDefaults)

// This context is needed for the mobile app only. For web, fallback to defaults.
const NetInfoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => children

export { NetInfoContext, NetInfoProvider, ConnectionStates }
