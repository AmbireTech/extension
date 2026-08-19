import { NfcWalletType } from '@ambire-common/interfaces/keystore'
import { NfcWalletConfigEntry } from '@common/modules/hardware-wallets/nfc/types'

/**
 * Registry of supported NFC (tap-to-sign) cards.
 */
export const NfcWalletConfigs = [
  {
    type: 'keycard',
    label: 'Keycard'
  }
] as const satisfies readonly NfcWalletConfigEntry[]

export const NfcWalletRegistry = NfcWalletConfigs.reduce(
  (acc, card) => {
    acc[card.type] = card
    return acc
  },
  {} as Record<NfcWalletType, (typeof NfcWalletConfigs)[number]>
)
