import { BIP44_STANDARD_DERIVATION_TEMPLATE } from '@ambire-common/consts/derivation'

export const ImTokenQrWallet = {
  walletType: 'imtoken' as const,
  protocol: 'ur' as const,

  label: 'imToken',

  /**
   * imToken follows the standard Ethereum BIP44 path:
   * m/44'/60'/0'/0/{index}
   */
  hdPathTemplate: BIP44_STANDARD_DERIVATION_TEMPLATE,

  /**
   * Relative path from exported xpub.
   * Most UR wallets export xpub at m/44'/60'/0'
   */
  relativePathTemplate: '0/{index}'
}
