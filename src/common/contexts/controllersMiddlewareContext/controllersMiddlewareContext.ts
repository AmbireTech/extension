import { createContext } from 'react'

import {
  controllersMiddlewareContextDefaults,
  ControllersMiddlewareContextReturnType
} from './types'

export const ControllersMiddlewareContext = createContext<ControllersMiddlewareContextReturnType>(
  controllersMiddlewareContextDefaults
)
