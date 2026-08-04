import React, { createContext } from 'react'

export interface ControllersStateLoadedContextType {
  /**
   * The controllers the current route needs have reported their state, so the route
   * tree can be rendered. Flips as soon as the route's critical subset lands, which
   * for the popup dashboard is a handful of controllers, not all of them.
   */
  canRenderRoute: boolean
  /**
   * Every registered controller has reported its state. Gate on this before reading
   * or acting on state that isn't in the current route's critical subset.
   */
  areAllControllerStatesLoaded: boolean
  /**
   * The initial load took longer than expected and some controllers still haven't
   * reported their state.
   */
  isStatesLoadingTakingTooLong: boolean
}

const ControllersStateLoadedContext = createContext<ControllersStateLoadedContextType>({
  canRenderRoute: false,
  areAllControllerStatesLoaded: false,
  isStatesLoadingTakingTooLong: false
})

export { ControllersStateLoadedContext }
