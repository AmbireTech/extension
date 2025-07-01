import { Action } from '@web/extension-services/background/actions'

export type BackgroundServiceContextReturnType = {
  /**
   * Dispatches an action to the extension background service.
   * Does not return the result of the action.
   * It will only work when called from a focused window!
   */
  dispatch: (action: Action, windowId?: number) => void
  windowId: number | undefined
}

export const backgroundServiceContextDefaults: BackgroundServiceContextReturnType = {
  dispatch: Promise.resolve,
  windowId: undefined
}
