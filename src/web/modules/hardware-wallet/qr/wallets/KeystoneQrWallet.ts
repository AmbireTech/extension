import { BIP44_STANDARD_DERIVATION_TEMPLATE } from '@ambire-common/consts/derivation'
import { QrWalletConfig } from '@ambire-common/interfaces/keyIterator'

export const KeystoneQrWallet: QrWalletConfig = {
  walletType: 'keystone',
  protocol: 'ur',
  label: 'Keystone',
  hdPathTemplate: BIP44_STANDARD_DERIVATION_TEMPLATE,
  relativePathTemplate: '<account>',
  tutorialUrl: 'https://help.ambire.com/en/articles/14612715'
}
