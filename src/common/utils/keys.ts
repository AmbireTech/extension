import { HARDWARE_WALLET_DEVICE_NAMES } from '@ambire-common/consts/hardwareWallets'
import { Key } from '@ambire-common/interfaces/keystore'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

type KeystoreState = AllControllersMappingType['KeystoreController']

// Stable, so a selector doesn't return a new array (and re-render) on every update
const NO_KEYS: Key[] = []

/** The imported keys this device can sign with */
export const selectKeys = (state: KeystoreState) => state.keys || NO_KEYS

/** The imported keys this device can't sign with, e.g. a GridPlus key synced to mobile */
export const selectUnsupportedKeys = (state: KeystoreState) => state.unsupportedKeys || NO_KEYS

/** The name of the device behind a key, e.g. "Ledger", or an empty string for a private key */
export const getKeyDeviceName = (type: Key['type']): string =>
  type === 'internal' ? '' : HARDWARE_WALLET_DEVICE_NAMES[type] || type
