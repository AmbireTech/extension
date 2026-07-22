import type EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { controllersNestedInMainMapping } from '@common/constants/controllersMapping'

const MAIN_CONTROLLER_NAME = 'MainController'

// Serializes a controller's public state for the UI.
//
// For the MainController we strip the nested sub-controllers' states: each nested
// controller is sent to the UI as its own top-level message, so keeping them here
// would stringify the same (potentially large) state twice.
// Keep in mind: if we just spread `ctrl` instead of calling `ctrl.toJSON()`, the getters won't be included.
//
// Used by both the update path (background `sendUpdate`) and the initial-state path
// (`INIT_CONTROLLER_STATE`) so the two can never drift apart.
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
