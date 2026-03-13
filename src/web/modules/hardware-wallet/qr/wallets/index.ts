import { ImTokenQrWallet } from './ImTokenQrWallet'
import { KeystoneQrWallet } from './KeystoneQrWallet'

export const QrWalletRegistry = {
  keystone: KeystoneQrWallet,
  imtoken: ImTokenQrWallet
}

export type QrWalletType = keyof typeof QrWalletRegistry
