import { ImTokenQrWallet } from './ImTokenQrWallet'
import { KeystoneQrWallet } from './KeystoneQrWallet'

/**
 * Registry of supported QR-based hardware wallets.
 *
 *
 * To add a new wallet:
 * 1. Create a wallet config (e.g. `NewWalletQrWallet.ts`) with:
 *    - walletType
 *    - hdPathTemplate
 *    - relativePathTemplate
 *
 * 2. Register it here.
 *
 * 3. Ensure `parseAccountPayload()` returns the correct `walletType`
 *    so it can be resolved at runtime.
 *
 * Notes:
 * - UR-based wallets can reuse `UrQrProtocolAdapter`
 * - Add custom logic only if the wallet has non-standard behavior
 */
export const QrWalletRegistry = {
  keystone: KeystoneQrWallet,
  imtoken: ImTokenQrWallet
}

export type QrWalletType = keyof typeof QrWalletRegistry
