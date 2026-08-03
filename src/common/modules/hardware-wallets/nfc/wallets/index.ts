import { NfcWalletConfigEntry } from '@common/modules/hardware-wallets/nfc/types'

/**
 * Registry of supported NFC (tap-to-sign) cards.
 *
 * To add a new card: add an entry here and teach the native NFC service how to
 * talk to it (each card has its own applet / APDU protocol).
 */
export const NfcWalletConfigs = [
  {
    type: 'keycard',
    label: 'Keycard'
  }
] as const satisfies readonly NfcWalletConfigEntry[]
