import { MainController } from '@ambire-common/controllers/main/main'
import { controllersNestedInMainMapping } from '@common/constants/controllersMapping'
import { WalletStateController } from '@web/extension-services/background/controllers/wallet-state'

export const baseControllersMapping = {
  MainController,
  WalletStateController
}

export const controllersMapping = {
  ...baseControllersMapping,
  ...controllersNestedInMainMapping
}

export type MobileBaseControllersMappingType = {
  [K in keyof typeof baseControllersMapping]: InstanceType<(typeof baseControllersMapping)[K]>
}

export type MobileAllControllersMappingType = {
  [K in keyof typeof controllersMapping]: InstanceType<(typeof controllersMapping)[K]>
}
