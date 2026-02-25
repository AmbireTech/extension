import { MainController } from '@ambire-common/controllers/main/main'
import { controllersNestedInMainMapping } from '@common/constants/controllersMapping'

export const baseControllersMapping = {
  MainController
}

export const controllersMapping = {
  ...baseControllersMapping,
  ...controllersNestedInMainMapping
}

export type MobileBaseControllersMappingType = {
  [K in keyof typeof baseControllersMapping]: InstanceType<(typeof baseControllersMapping)[K]>
}
