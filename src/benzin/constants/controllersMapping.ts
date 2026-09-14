import type { ContractNamesController } from '@ambire-common/controllers/contractNames/contractNames'
import type { DomainsController } from '@ambire-common/controllers/domains/domains'
import type { ProvidersController } from '@ambire-common/controllers/providers/providers'
import type { StorageController } from '@ambire-common/controllers/storage/storage'
import { createExhaustiveArray } from '@common/utils/createExhaustiveArray'

export type ExplorerBaseControllersMappingType = {
  StorageController: StorageController
  ProvidersController: ProvidersController
  DomainsController: DomainsController
  ContractNamesController: ContractNamesController
}

export const controllerMapping = createExhaustiveArray<ExplorerBaseControllersMappingType>()([
  'StorageController',
  'ProvidersController',
  'DomainsController',
  'ContractNamesController'
])
