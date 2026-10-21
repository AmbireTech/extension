import hexStringToUint8Array from '@ambire-common/utils/hexStringToUint8Array'
import { DeviceModelId } from '@ledgerhq/device-management-kit'

/**
 * Helpers for sideloading a custom Ledger app (the "Ambire Signer" EIP-7702
 * delegation app) by replaying its `.apdu` load script over DMK's `sendApdu`.
 *
 * A Ledger `.apdu` file produced by the app build is a plaintext BOLOS load
 * script: one hex-encoded APDU per line, all wrapped as `E0 00 00 00 <Lc> <cmd>`
 * (CREATE APP, LOAD code chunks, CRC, COMMIT). Its payloads are the *unwrapped*
 * inner secure commands, so they cannot be replayed in the clear — the device
 * answers `0x6615`. `ledgerSideload.ts` opens an SCP v2 secure channel and wraps
 * every payload before sending it; no payload depends on a device response, so
 * the order is static. See the `ledger` skill for the full picture.
 */

// Parses a Ledger `.apdu` load script into the raw commands to replay in order.
export const parseLedgerAppApdus = (dump: string): Uint8Array[] =>
  dump
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map(hexStringToUint8Array)

const SECURE_INS_CREATE_APP = 0x0b

/**
 * The device OS API level a load script was built for: the byte right after the
 * CREATE APP instruction (`E0 00 00 00 <Lc> 0B <apiLevel> ...`). The device only
 * installs an app built for its own API level, else CREATE APP fails with 0x511f.
 */
export const getLoadScriptApiLevel = (commands: Uint8Array[]): number | undefined =>
  commands.find((command) => command[5] === SECURE_INS_CREATE_APP)?.[6]

/**
 * Device OS `major.minor` that ships each API level, per model. Every OS minor
 * release bumps the API level. Source: `API_LEVEL` in `Makefile.defines` at the
 * `<model>_<os>` tags of https://github.com/LedgerHQ/ledger-secure-sdk.
 * Add a row when the bundled "Ambire Signer" builds move to a new API level.
 */
const OS_VERSION_BY_API_LEVEL: Record<number, Partial<Record<DeviceModelId, [number, number]>>> = {
  27: {
    [DeviceModelId.NANO_SP]: [1, 7],
    [DeviceModelId.STAX]: [1, 11],
    [DeviceModelId.FLEX]: [1, 7],
    [DeviceModelId.APEX]: [1, 2]
  }
}

// Parses `major.minor` out of an OS version string like "1.7.0" or "1.7.0-rc1".
const parseMajorMinor = (version: string): [number, number] | undefined => {
  const [major, minor] = version.split('-')[0]!.split('.').map(Number)
  if (!Number.isInteger(major) || !Number.isInteger(minor)) return undefined
  return [major!, minor!]
}

/**
 * Tells, before anything is written to the device, whether the bundled build
 * would be rejected for an OS mismatch (0x511f), and which side has to update:
 * the user's Ledger, or Ambire (the device already runs a newer OS than our
 * build supports). Returns `null` when compatible or when we can't tell, in which
 * case the install proceeds and a mismatch still surfaces as 0x511f.
 */
export const getOsMismatchMessage = (
  modelId: DeviceModelId,
  deviceOsVersion: string,
  buildApiLevel: number | undefined
): string | null => {
  if (buildApiLevel === undefined) return null
  const buildOs = OS_VERSION_BY_API_LEVEL[buildApiLevel]?.[modelId]
  const deviceOs = parseMajorMinor(deviceOsVersion)
  if (!buildOs || !deviceOs) return null

  const comparison = deviceOs[0] - buildOs[0] || deviceOs[1] - buildOs[1]
  if (comparison > 0)
    return 'Your Ledger firmware is newer than our Ambire Signer app supports. We are preparing an update. Please update Ambire once it is available, then try again.'
  if (comparison < 0)
    return 'Your Ledger needs a firmware update. Please update it in Ledger Live, then try again.'

  return null
}

// A status word is 2 bytes; success is 0x9000.
export const isSuccessStatusWord = (statusCode: Uint8Array): boolean =>
  statusCode.length === 2 && statusCode[0] === 0x90 && statusCode[1] === 0x00

const formatStatusWord = (statusCode: Uint8Array): string =>
  Array.from(statusCode)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

// Maps a known install failure status word to a user-facing message. The status
// word values mirror Ledger's own manager error codes (as used by the DMK
// `CommandUtils`, which is not part of the package's public API).
export const getInstallErrorMessage = (statusCode: Uint8Array): string => {
  const sw = formatStatusWord(statusCode)

  // Refused by the user on-device ("Back to safety").
  if (sw === '5501' || sw === '6985') return 'App installation was rejected on the Ledger device.'

  // An app with the same name is already installed. Most firmwares instead offer
  // to remove it on-device (that is our update path), so this is a rare fallback.
  if (sw === '6a80' || sw === '6a81' || sw === '6a8e' || sw === '6a8f')
    return 'Ambire Signer is already on your Ledger. Remove it from the device, then try again to get the latest version.'

  // Nano X firmware forbids sideloading custom apps (Nano S Plus / Stax / Flex allow it).
  if (sw === '5120')
    return 'Sideloading apps is not supported on the Ledger Nano X. This flow requires a Nano S Plus, Stax, or Flex.'

  // App built against an OS/SDK version incompatible with the device firmware.
  // Normally caught earlier, with a clearer message, by `getOsMismatchMessage`.
  if (sw === '511f')
    return 'This Ambire Signer build is not compatible with your Ledger firmware version.'

  // Not enough free space on the device.
  if (sw === '6a84' || sw === '6a85' || sw === '5102' || sw === '5103')
    return 'Not enough space on the Ledger device. Please uninstall an app and try again.'

  // Device is locked / another app is open (must be at the dashboard). An open
  // app answers 6d00/6e00, because these commands only exist on the dashboard.
  if (sw === '5515' || sw === '6982' || sw === '5303' || sw === '6d00' || sw === '6e00')
    return 'Please unlock your Ledger, quit any open app and return to its home screen, then try again.'

  return `App installation failed on the Ledger device (status ${sw}).`
}
