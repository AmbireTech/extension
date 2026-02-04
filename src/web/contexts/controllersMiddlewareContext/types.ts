import { Action } from '@web/extension-services/background/actions'

export type ControllersMiddlewareContextReturnType = {
  /**
   * Dispatches an action to the extension background service.
   * Does not return the result of the action.
   * It will only work when called from a focused window!
   */
  dispatch: (action: Action, windowId?: number) => void
  windowId?: number
}

export const controllersMiddlewareContextDefaults: ControllersMiddlewareContextReturnType = {
  dispatch: Promise.resolve,
  windowId: undefined
}
