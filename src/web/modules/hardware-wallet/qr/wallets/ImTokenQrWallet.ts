import { QrWalletConfig } from '@ambire-common/interfaces/keyIterator'

export const ImTokenQrWallet: QrWalletConfig = {
  protocol: 'ur' as const,
  label: 'imToken',
  tutorialUrl:
    'https://help.ambire.com/en/articles/14483029-how-to-connect-ambire-wallet-with-imtoken'
}
