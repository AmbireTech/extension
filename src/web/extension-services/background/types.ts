import AccountAdderController from 'ambire-common/src/controllers/accountAdder/accountAdder'
import { KeystoreController } from 'ambire-common/src/controllers/keystore/keystore'
import { MainController } from 'ambire-common/src/controllers/main/main'

export const controllersMapping = {
  accountAdder: AccountAdderController,
  keystore: KeystoreController
  // Add other controllers here:
  // - key is the name of the controller
  // - value is the type of the controller
}
export const controllersMappingIncludingMainController = {
  main: MainController,
  ...controllersMapping
}

export type ControllersMappingType = {
  [K in keyof typeof controllersMappingIncludingMainController]: InstanceType<
    typeof controllersMappingIncludingMainController[K]
  >
}
