import { ImTokenQrWallet } from './ImTokenQrWallet'
import { KeystoneQrWallet } from './KeystoneQrWallet'

/**
 * Registry of supported QR-based hardware wallets.
 *
 *
 * To add a new wallet:
 * 1. Create a wallet config (e.g. `NewWalletQrWallet.ts`) with:
 *    - protocol
 *    - label
 *    - tutorialUrl
 * 2. Register it here.
 */
export const QrWalletRegistry = {
  keystone: KeystoneQrWallet,
  imtoken: ImTokenQrWallet
}

export type QrWalletType = keyof typeof QrWalletRegistry
