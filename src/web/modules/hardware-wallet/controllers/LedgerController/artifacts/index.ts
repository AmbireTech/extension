import { DeviceModelId } from '@ledgerhq/device-management-kit'

import { AMBIRE_SIGNER_NANO_X_APDU } from './ambireSignerNanoX'

// Per-device-model "Ambire Signer" load scripts, keyed by the connected model.
//
// ponytail: only the Nano X build exists so far. Real Nano X hardware CANNOT
// sideload (firmware returns 0x5120), so this entry is reachable only via the
// Speculos emulator. Add the sideloadable models — Nano S Plus, Stax, Flex — as
// the colleague provides their builds (validate each with
// scratchpad/validate-ledger-apdu.mjs before bundling).
export const AMBIRE_SIGNER_APDUS: Partial<Record<DeviceModelId, string>> = {
  [DeviceModelId.NANO_X]: AMBIRE_SIGNER_NANO_X_APDU
}
