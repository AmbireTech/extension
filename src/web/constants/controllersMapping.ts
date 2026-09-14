import type { MainController } from '@ambire-common/controllers/main/main'
import { controllersNestedInMainMapping } from '@common/constants/controllersMapping'
import { createExhaustiveArray } from '@common/utils/createExhaustiveArray'

import type { AutoLockController } from '@common/controllers/auto-lock'
import type { WalletStateController } from '@common/controllers/wallet-state'
import type { ExtensionUpdateController } from '@web/extension-services/background/controllers/extension-update'

export type ExtensionBaseControllersMappingType = {
  MainController: MainController
  WalletStateController: WalletStateController
  AutoLockController: AutoLockController
  ExtensionUpdateController: ExtensionUpdateController
}

export const baseControllersMapping = createExhaustiveArray<ExtensionBaseControllersMappingType>()([
  'MainController',
  'WalletStateController',
  'AutoLockController',
  'ExtensionUpdateController'
])

export const controllersMapping = {
  ...baseControllersMapping,
  ...controllersNestedInMainMapping
}
