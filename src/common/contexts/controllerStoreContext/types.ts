import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'

import { ControllerHelpersStore } from '../controllerStoreContext/controllerHelpersStore'
import { ControllerStore } from '../controllerStoreContext/controllerStore'
import { SubscriptionManager } from '../controllerStoreContext/subscriptionManager'

export type ControllerStoreContextReturnType = {
  controllerStore: ControllerStore
  controllerHelpersStore: ControllerHelpersStore
  stateSubscriptionManager: SubscriptionManager
  helpersSubscriptionManager: SubscriptionManager
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
  stateSubscriptionManager: {} as SubscriptionManager,
  helpersSubscriptionManager: {} as SubscriptionManager,
  isStoreReady: false,
  debounceControllerUpdates: () => 'EMITTED'
}
