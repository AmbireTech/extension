import type { ContractNamesController } from '@ambire-common/controllers/contractNames/contractNames'
import type { DomainsController } from '@ambire-common/controllers/domains/domains'
import type { Erc7730Controller } from '@ambire-common/controllers/erc7730/erc7730'
import type { FeatureFlagsController } from '@ambire-common/controllers/featureFlags/featureFlags'
import type { ProvidersController } from '@ambire-common/controllers/providers/providers'
import type { StorageController } from '@ambire-common/controllers/storage/storage'
import { createExhaustiveArray } from '@common/utils/createExhaustiveArray'

export type ExplorerBaseControllersMappingType = {
  StorageController: StorageController
  ProvidersController: ProvidersController
  DomainsController: DomainsController
  FeatureFlagsController: FeatureFlagsController
  Erc7730Controller: Erc7730Controller
  ContractNamesController: ContractNamesController
}

export const controllerMapping = createExhaustiveArray<ExplorerBaseControllersMappingType>()([
  'StorageController',
  'ProvidersController',
  'DomainsController',
  'FeatureFlagsController',
  'Erc7730Controller',
  'ContractNamesController'
])
