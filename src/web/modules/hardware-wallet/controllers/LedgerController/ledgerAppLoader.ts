import hexStringToUint8Array from '@ambire-common/utils/hexStringToUint8Array'

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

  // An app with the same name is already installed.
  if (sw === '6a80' || sw === '6a81' || sw === '6a8e' || sw === '6a8f')
    return 'This app is already installed on the Ledger device.'

  // Nano X firmware forbids sideloading custom apps (Nano S Plus / Stax / Flex allow it).
  if (sw === '5120')
    return 'Sideloading apps is not supported on the Ledger Nano X. This flow requires a Nano S Plus, Stax, or Flex.'

  // App built against an OS/SDK version incompatible with the device firmware.
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
