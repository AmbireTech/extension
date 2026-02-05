import { Action } from '@web/extension-services/background/actions'
import { ControllersMappingType } from '@web/extension-services/background/types'
import { ControllerAction } from '@web/hooks/useController/useController'

import { ControllerStore } from './controllerStore'

export type AnyControllerAction = ControllerAction<keyof ControllersMappingType>

export type ControllersMiddlewareContextReturnType = {
  /**
   * Dispatches an action to the extension background service.
   * Does not return the result of the action.
   * It will only work when called from a focused window!
   */
  dispatch: (action: Action, windowId?: number) => void
  windowId?: number
  controllerStore: ControllerStore
  isStoreReady: boolean
}

export const controllersMiddlewareContextDefaults: ControllersMiddlewareContextReturnType = {
  dispatch: Promise.resolve,
  windowId: undefined,
  controllerStore: {} as ControllerStore,
  isStoreReady: false
}
