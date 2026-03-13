import { BIP44_STANDARD_DERIVATION_TEMPLATE } from '@ambire-common/consts/derivation'
import { QrProtocolType, QrWalletType } from '@ambire-common/interfaces/keystore'

export type QrWalletConfig = {
  walletType: QrWalletType
  protocol: QrProtocolType
  label: string
  hdPathTemplate: string
  relativePathTemplate: string
}

export const KeystoneQrWallet: QrWalletConfig = {
  walletType: 'keystone',
  protocol: 'ur',
  label: 'Keystone',
  hdPathTemplate: BIP44_STANDARD_DERIVATION_TEMPLATE,
  relativePathTemplate: '0/{index}'
}
