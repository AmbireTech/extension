import { QrWalletConfig } from '@ambire-common/interfaces/keyIterator'
import { QrWalletType } from '@ambire-common/interfaces/keystore'

/**
 * Registry of supported QR-based hardware wallets.
 *
 *
 * To add a new wallet:
 * Add a new entry to `QrWalletConfigs`.
 */
export type QrWalletConfigEntry = QrWalletConfig & { type: QrWalletType }

export const QrWalletConfigs = [
  {
    type: 'keystone',
    protocol: 'ur',
    label: 'Keystone',
    tutorialUrl: 'https://help.ambire.com/en/articles/14612715'
  },
  {
    type: 'keycard',
    protocol: 'ur',
    label: 'Keycard',
    tutorialUrl: 'https://docs.keycard.tech/en/wallets'
  },
  {
    type: 'imtoken',
    protocol: 'ur',
    label: 'ImToken',
    tutorialUrl:
      'https://help.ambire.com/en/articles/14483029-how-to-connect-ambire-wallet-with-imtoken'
  }
] as const satisfies readonly QrWalletConfigEntry[]

/**
 * Backwards-compatible map (useful for quick lookups).
 * Prefer iterating over `QrWalletConfigs` in UI.
 */
export const QrWalletRegistry = QrWalletConfigs.reduce(
  (acc, w) => {
    acc[w.type] = w
    return acc
  },
  {} as Record<QrWalletType, (typeof QrWalletConfigs)[number]>
)
