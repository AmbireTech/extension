import { HDNodeWallet } from 'ethers'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import {
  BIP44_STANDARD_DERIVATION_TEMPLATE,
  HD_PATH_TEMPLATE_TYPE
} from '@ambire-common/consts/derivation'
import { KeyIterator as KeyIteratorInterface } from '@ambire-common/interfaces/keyIterator'
import { ExternalSignerController } from '@ambire-common/interfaces/keystore'
import {
  getDerivableHdPathTemplates,
  getHdPathTemplateRelativeToOrigin
} from '@ambire-common/utils/hdPath'
import { NfcExportedKey } from '@common/modules/hardware-wallets/nfc/types'
import { NfcWalletRegistry } from '@common/modules/hardware-wallets/nfc/wallets'

interface KeyIteratorProps {
  controller: ExternalSignerController
}

const MISSING_CONTROLLER_MSG =
  'Unable to interact with the card. The card controller is missing. Please try again or contact Ambire support.'
const INVALID_PARAMS_MSG = 'Unable to retrieve keys because of invalid parameters received.'
const MISSING_ACCOUNT_KEY_MSG =
  'Could not generate an address because the card account key is missing. Please re-import the card account.'
const getDerivationErrorMsg = (error: any) =>
  `Could not generate an Ethereum address from the account key received from the card. Technical details: <${error?.message}>.`

/** What `HDNodeWallet.fromExtendedKey` gives back for a public (neutered) key. */
type AccountNode = ReturnType<typeof HDNodeWallet.fromExtendedKey>

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

  /** The path the card exported the extended public key from. */
  #originHdPath?: string

  #hdPathTemplate: HD_PATH_TEMPLATE_TYPE = BIP44_STANDARD_DERIVATION_TEMPLATE

  get hdPathTemplate() {
    return this.#hdPathTemplate
  }

  get derivableHdPathTemplates() {
    return this.#originHdPath ? getDerivableHdPathTemplates(this.#originHdPath) : []
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

    if (!getHdPathTemplateRelativeToOrigin(hdPath, BIP44_STANDARD_DERIVATION_TEMPLATE)) {
      throw new ExternalSignerError(`Unsupported account path exported from the card: ${hdPath}.`, {
        sendCrashReport: true
      })
    }

    this.#extendedPublicKey = extendedPublicKey
    this.#originHdPath = hdPath
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

  #deriveAddress(accountNode: AccountNode, index: number, relativePathTemplate: string): string {
    try {
      return accountNode.derivePath(relativePathTemplate.replace('<account>', String(index)))
        .address
    } catch (error: any) {
      throw new ExternalSignerError(getDerivationErrorMsg(error), { sendCrashReport: true })
    }
  }

  async retrieve(
    fromToArr: { from: number; to: number }[],
    hdPathTemplate: HD_PATH_TEMPLATE_TYPE = this.#hdPathTemplate
  ): Promise<string[]> {
    if (!this.#extendedPublicKey || !this.#originHdPath) {
      throw new ExternalSignerError(MISSING_ACCOUNT_KEY_MSG)
    }

    const relativePathTemplate = getHdPathTemplateRelativeToOrigin(
      this.#originHdPath,
      hdPathTemplate
    )

    if (!relativePathTemplate) {
      throw new ExternalSignerError(
        'This derivation path cannot be browsed with the account key exported from the card. Please pick another one.'
      )
    }

    // Parsed once per retrieval rather than for every address, which is a base58
    // decode each time
    let accountNode: AccountNode
    try {
      accountNode = HDNodeWallet.fromExtendedKey(this.#extendedPublicKey)
    } catch (error: any) {
      throw new ExternalSignerError(getDerivationErrorMsg(error), { sendCrashReport: true })
    }

    const keys: string[] = []

    for (const { from, to } of fromToArr) {
      if ((!from && from !== 0) || (!to && to !== 0)) throw new Error(INVALID_PARAMS_MSG)

      for (let i = from; i <= to; i++)
        keys.push(this.#deriveAddress(accountNode, i, relativePathTemplate))
    }

    return keys
  }
}

export default NfcKeyIterator
