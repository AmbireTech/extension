import React, { createContext } from 'react'

export interface ControllersStateLoadedContextType {
  areControllerStatesLoaded: boolean
  isStatesLoadingTakingTooLong: boolean
}

const ControllersStateLoadedContext = createContext<ControllersStateLoadedContextType>({
  areControllerStatesLoaded: false,
  isStatesLoadingTakingTooLong: false
})

export { ControllersStateLoadedContext }
