import type { MainController } from '@ambire-common/controllers/main/main'
import { controllersNestedInMainMapping } from '@common/constants/controllersMapping'
import { createExhaustiveArray } from '@common/utils/createExhaustiveArray'

import type { WalletStateController } from '@common/controllers/wallet-state'
export type MobileBaseControllersMappingType = {
  MainController: MainController
  WalletStateController: WalletStateController
}

export const baseControllersMapping = createExhaustiveArray<MobileBaseControllersMappingType>()([
  'MainController',
  'WalletStateController'
])

export const controllersMapping = {
  ...baseControllersMapping,
  ...controllersNestedInMainMapping
}
