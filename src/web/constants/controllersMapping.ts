import { MainController } from '@ambire-common/controllers/main/main'
import { controllersNestedInMainMapping } from '@common/constants/controllersMapping'
import AutoLockController from '@web/extension-services/background/controllers/auto-lock'
import { ExtensionUpdateController } from '@web/extension-services/background/controllers/extension-update'
import { WalletStateController } from '@web/extension-services/background/controllers/wallet-state'

export const baseControllersMapping = {
  MainController,
  WalletStateController,
  AutoLockController,
  ExtensionUpdateController
}

export const controllersMapping = {
  ...baseControllersMapping,
  ...controllersNestedInMainMapping
}

export type ExtensionBaseControllersMappingType = {
  [K in keyof typeof baseControllersMapping]: InstanceType<(typeof baseControllersMapping)[K]>
}
