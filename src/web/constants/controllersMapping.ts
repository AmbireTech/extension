import { MainController } from '@ambire-common/controllers/main/main'
import { controllersNestedInMainMapping } from '@common/constants/controllersMapping'
import { AutoLockController } from '@common/controllers/auto-lock'
import { WalletStateController } from '@common/controllers/wallet-state'
import { ExtensionUpdateController } from '@web/extension-services/background/controllers/extension-update'

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
