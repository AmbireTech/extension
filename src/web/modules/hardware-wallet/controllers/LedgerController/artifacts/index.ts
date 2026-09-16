import { DeviceModelId } from '@ledgerhq/device-management-kit'

import { AMBIRE_SIGNER_APEX_APDU } from './ambireSignerApex'
import { AMBIRE_SIGNER_FLEX_APDU } from './ambireSignerFlex'
import { AMBIRE_SIGNER_NANO_S_PLUS_APDU } from './ambireSignerNanoSPlus'
// import { AMBIRE_SIGNER_NANO_X_APDU } from './ambireSignerNanoX'
import { AMBIRE_SIGNER_STAX_APDU } from './ambireSignerStax'

export { AMBIRE_SIGNER_APP_NAME } from './constants'

// Per-device-model "Ambire Signer" load scripts, keyed by the connected model.
// Sideloading works on limited set of newer ledger devices.
// Each build is validated with scratchpad/validate-ledger-apdu.mjs
// (name "Ambire Signer" + Ambire delegator whitelisted) before bundling.
export const AMBIRE_SIGNER_APDUS: Partial<Record<DeviceModelId, string>> = {
  // TODO: The Nano X entry i reachable only via the Speculos emulator - real Nano X
  // firmware refuses th load (0x5120). But keep entry, might be used for the E2E tests.
  // [DeviceModelId.NANO_X]: AMBIRE_SIGNER_NANO_X_APDU,
  [DeviceModelId.NANO_SP]: AMBIRE_SIGNER_NANO_S_PLUS_APDU,
  [DeviceModelId.STAX]: AMBIRE_SIGNER_STAX_APDU,
  [DeviceModelId.FLEX]: AMBIRE_SIGNER_FLEX_APDU,
  [DeviceModelId.APEX]: AMBIRE_SIGNER_APEX_APDU
}
