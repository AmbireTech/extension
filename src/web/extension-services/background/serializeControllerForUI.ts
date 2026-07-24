import type EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { controllersNestedInMainMapping } from '@common/constants/controllersMapping'

const MAIN_CONTROLLER_NAME = 'MainController'

/**
 * Serializes a controller's public state for the UI.
 */
export function serializeControllerForUI(ctrl: EventEmitter): object {
  const state = ctrl.toJSON()

  if (ctrl.name === MAIN_CONTROLLER_NAME) {
    controllersNestedInMainMapping.forEach((nestedCtrlName) => {
      Object.entries(state).forEach(([key, value]) => {
        if (value && typeof value === 'object' && value.name === nestedCtrlName) {
          delete (state as any)[key]
        }
      })
    })
  }

  return state
}
