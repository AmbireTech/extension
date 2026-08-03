import { ExternalSignerController } from '@ambire-common/interfaces/keystore'
import { NfcSignature } from '@common/modules/hardware-wallets/nfc/types'

export interface NfcControllerInterface extends ExternalSignerController {
  /**
   * Asks the card to sign an already computed 32-byte hash. NFC cards sign
   * raw hashes only - the payload is always hashed on our side.
   *
   * `expectedKeyUid` is the id of the wallet the account was imported from, so
   * the card can be rejected before the PIN is spent when a different one is tapped.
   */
  signHash: (args: {
    hashHex: string
    path: string
    expectedKeyUid: string
  }) => Promise<NfcSignature>
}
