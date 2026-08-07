import { HDNodeWallet } from 'ethers'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import {
  BIP44_STANDARD_DERIVATION_TEMPLATE,
  HD_PATH_TEMPLATE_TYPE
} from '@ambire-common/consts/derivation'
import { KeyIterator as KeyIteratorInterface } from '@ambire-common/interfaces/keyIterator'
import { ExternalSignerController } from '@ambire-common/interfaces/keystore'
import { NfcExportedKey } from '@common/modules/hardware-wallets/nfc/types'
import { NfcWalletRegistry } from '@common/modules/hardware-wallets/nfc/wallets'

interface KeyIteratorProps {
  controller: ExternalSignerController
}

const MISSING_CONTROLLER_MSG =
  'Unable to interact with the card. The card controller is missing. Please try again or contact Ambire support.'
const INVALID_PARAMS_MSG = 'Unable to retrieve keys because of invalid parameters received.'

/**
 * Serves for retrieving a range of addresses/keys from an NFC card.
 *
 * The card is tapped only once (during import) to export the extended public key
 * of the account-level path. Every address afterwards is derived locally from it,
 * so browsing the account list does not require the card to be present.
 */
class NfcKeyIterator implements KeyIteratorInterface {
  type = 'nfc' as const

  subType = 'hw' as const

  controller: ExternalSignerController

  #extendedPublicKey?: string

  #hdPathTemplate: HD_PATH_TEMPLATE_TYPE = BIP44_STANDARD_DERIVATION_TEMPLATE

  get hdPathTemplate() {
    return this.#hdPathTemplate
  }

  constructor({ controller }: KeyIteratorProps) {
    if (!controller) throw new Error(MISSING_CONTROLLER_MSG)

    this.controller = controller
  }

  initFromExportedKey({ extendedPublicKey, hdPath, keyUid, nfcWalletType }: NfcExportedKey) {
    if (!extendedPublicKey) {
      throw new ExternalSignerError(
        'The card did not return an account key. Please try tapping it again.'
      )
    }

    if (hdPath !== "m/44'/60'/0'/0") {
      throw new ExternalSignerError(`Unsupported account path exported from the card: ${hdPath}.`, {
        sendCrashReport: true
      })
    }

    this.#extendedPublicKey = extendedPublicKey
    this.#hdPathTemplate = BIP44_STANDARD_DERIVATION_TEMPLATE
    // The key id identifies which card (or rather, which wallet on a card) these
    // accounts belong to. It ends up in the key meta as the device id, so signing
    // can tell the user when a different card is tapped.
    this.controller.deviceId = keyUid
    // Which kind of card it was also ends up in the key meta, so signing later goes
    // to the service that knows how to talk to it, and the key shows the card's name.
    this.controller.nfcWalletType = nfcWalletType
    this.controller.deviceModel = NfcWalletRegistry[nfcWalletType].label
  }

  #deriveAddress(index: number): string {
    if (!this.#extendedPublicKey) {
      throw new ExternalSignerError(
        'Could not generate an address because the card account key is missing. Please re-import the card account.'
      )
    }

    try {
      const hdNode = HDNodeWallet.fromExtendedKey(this.#extendedPublicKey)

      return hdNode.derivePath(String(index)).address
    } catch (error: any) {
      throw new ExternalSignerError(
        `Could not generate an Ethereum address from the account key received from the card. Technical details: <${error?.message}>.`,
        { sendCrashReport: true }
      )
    }
  }

  async retrieve(fromToArr: { from: number; to: number }[]): Promise<string[]> {
    const keys: string[] = []

    for (const { from, to } of fromToArr) {
      if ((!from && from !== 0) || (!to && to !== 0)) throw new Error(INVALID_PARAMS_MSG)

      for (let i = from; i <= to; i++) keys.push(this.#deriveAddress(i))
    }

    return keys
  }
}

export default NfcKeyIterator
