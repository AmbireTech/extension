import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'

import { ControllerHelpersStore } from '../controllerStoreContext/controllerHelpersStore'
import { ControllerStore } from '../controllerStoreContext/controllerStore'

export type ControllerStoreContextReturnType = {
  controllerStore: ControllerStore
  controllerHelpersStore: ControllerHelpersStore
  isStoreReady: boolean
  debounceControllerUpdates: (
    ctrlName: string,
    ctrl: EventEmitter,
    forceEmit?: boolean
  ) => 'DEBOUNCED' | 'EMITTED'
}

export const controllerStoreContextDefaults: ControllerStoreContextReturnType = {
  controllerStore: {} as ControllerStore,
  controllerHelpersStore: {} as ControllerHelpersStore,
  isStoreReady: false,
  debounceControllerUpdates: () => 'EMITTED'
}
