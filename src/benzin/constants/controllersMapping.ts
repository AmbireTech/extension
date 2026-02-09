import { ContractNamesController } from '@ambire-common/controllers/contractNames/contractNames'
import { DomainsController } from '@ambire-common/controllers/domains/domains'
import { ProvidersController } from '@ambire-common/controllers/providers/providers'
import { StorageController } from '@ambire-common/controllers/storage/storage'

export const controllersMapping = {
  StorageController,
  ProvidersController,
  DomainsController,
  ContractNamesController
}

export type ExplorerBaseControllersMappingType = {
  [K in keyof typeof controllersMapping]: InstanceType<(typeof controllersMapping)[K]>
}

export type ExplorerAllControllersMappingType = {
  [K in keyof typeof controllersMapping]: InstanceType<(typeof controllersMapping)[K]>
}
