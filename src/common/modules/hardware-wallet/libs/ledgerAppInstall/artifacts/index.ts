import { DeviceModelId } from '@ledgerhq/device-management-kit'

import type { AMBIRE_SIGNER_APDUS } from './apdus'

/**
 * The Ledger models that can install Ambire Signer, as stored in a key's `meta.deviceModel`.
 * Listed apart from the builds so checking a model doesn't load them.
 */
export const AMBIRE_SIGNER_DEVICE_MODELS: string[] = [
  DeviceModelId.NANO_SP,
  DeviceModelId.STAX,
  DeviceModelId.FLEX,
  DeviceModelId.APEX
]

/** Loads the "Ambire Signer" builds (about 1.5MB) only once an install starts */
export const loadAmbireSignerApdus = async (): Promise<typeof AMBIRE_SIGNER_APDUS> =>
  (await import('./apdus')).AMBIRE_SIGNER_APDUS
