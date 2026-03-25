import { BIP44_STANDARD_DERIVATION_TEMPLATE } from '@ambire-common/consts/derivation'
import { QrWalletConfig } from '@ambire-common/interfaces/keyIterator'

export const ImTokenQrWallet: QrWalletConfig = {
  walletType: 'imtoken' as const,
  protocol: 'ur' as const,
  label: 'imToken',
  hdPathTemplate: BIP44_STANDARD_DERIVATION_TEMPLATE,
  relativePathTemplate: '{index}',
  tutorialUrl: 'https://token.im' // TODO: replace it with real one
}
