import { DomainsController } from '@ambire-common/controllers/domains/domains'
import { ProvidersController } from '@ambire-common/controllers/providers/providers'
import { StorageController } from '@ambire-common/controllers/storage/storage'

export const controllersMapping = {
  StorageController,
  ProvidersController,
  DomainsController
}

export type RewardsBaseControllersMappingType = {
  [K in keyof typeof controllersMapping]: InstanceType<(typeof controllersMapping)[K]>
}

export type RewardsAllControllersMappingType = {
  [K in keyof typeof controllersMapping]: InstanceType<(typeof controllersMapping)[K]>
}
