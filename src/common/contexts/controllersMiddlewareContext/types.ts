import type { AllControllersMappingType } from '@common/constants/controllersMapping'
import { ControllerAction } from '@common/hooks/useController/useController'
import { Action, MethodAction } from '@common/types/actions'

export type AnyControllerAction = ControllerAction<keyof AllControllersMappingType>

export type ControllersMiddlewareContextReturnType = {
  /**
   * Dispatches an action to the extension background service.
   * Does not return the result of the action.
   * It will only work when called from a focused window!
   */
  dispatch: (action: MethodAction | Action, windowId?: number) => void
}

export const controllersMiddlewareContextDefaults: ControllersMiddlewareContextReturnType = {
  dispatch: Promise.resolve
}
