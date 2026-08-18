import type EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { controllersNestedInMainMapping } from '@common/constants/controllersMapping'

const MAIN_CONTROLLER_NAME = 'MainController'

const nestedControllerNames = new Set<string>(controllersNestedInMainMapping)

// The nested controllers are matched by their `name` and not by their key on the main
// state, because the keys don't match the controller names (`keystore` vs
// `KeystoreController`). `EventEmitter.name` returns `this.constructor.name`, so the
// build must keep class names for this to work.
const isNestedController = (value: unknown): boolean =>
  !!value && typeof value === 'object' && nestedControllerNames.has((value as EventEmitter).name)

/**
 * Serializes a controller's public state for the UI. The states of the controllers
 * nested in the main one are stripped, as the UI reads them from their own contexts.
 */
export function serializeControllerForUI(ctrl: EventEmitter): object {
  const state = ctrl.toJSON()

  if (ctrl.name !== MAIN_CONTROLLER_NAME) return state

  // Rebuilding the object instead of deleting keys keeps it out of V8's dictionary
  // mode, which the `richJson.stringify` that follows is sensitive to.
  return Object.fromEntries(Object.entries(state).filter(([, value]) => !isNestedController(value)))
}
