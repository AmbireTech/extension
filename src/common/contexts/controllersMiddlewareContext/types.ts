import { ControllersMappingType } from '@common/constants/controllersMapping'
import { ControllerAction } from '@common/hooks/useController/useController'
import { Action } from '@web/extension-services/background/actions'

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
