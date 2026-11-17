import { HDNodeWallet } from 'ethers'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import {
  BIP44_STANDARD_DERIVATION_TEMPLATE,
  DERIVATION_OPTIONS,
  HD_PATH_TEMPLATE_TYPE
} from '@ambire-common/consts/derivation'
import { KeyIterator as KeyIteratorInterface } from '@ambire-common/interfaces/keyIterator'
import { ParsedQrAccount } from '@ambire-common/interfaces/keystore'
import {
  getDerivableHdPathTemplates,
  getHdPathFromTemplate,
  getHdPathTemplateRelativeToOrigin
} from '@ambire-common/utils/hdPath'
import QrHardwareController from '@common/modules/hardware-wallets/controllers/QrHardwareController'

import { normalizeOriginHdPath } from '../../qr/utils'

interface KeyIteratorProps {
  controller: QrHardwareController
}

const MISSING_CONTROLLER_MSG =
  'Unable to interact with the QR hardware wallet. The QR controller is missing.'
const INVALID_PARAMS_MSG = 'Unable to retrieve keys because of invalid parameters received.'
/** Assumed when the scanned payload does not say which path its key came from. */
const DEFAULT_ORIGIN_HD_PATH = "m/44'/60'/0'"
const UNREACHABLE_HD_PATH_MSG =
  'This derivation path cannot be browsed with the account that was scanned from your QR wallet. Please pick another one.'
const UNSUPPORTED_EXPORTED_ACCOUNTS_MSG =
  "Ambire can't import the accounts in this QR code. Please make sure your hardware wallet uses a supported derivation path, export your accounts again and scan the new QR code."
const DUPLICATE_EXPORTED_ACCOUNT_MSG =
  'This QR code lists more than one account in the same place, so Ambire cannot tell which one is yours. Please export your accounts again and scan the new QR code.'
const getDerivationErrorMsg = (error: any) =>
  `Could not generate Ethereum address from the extended public key received from the QR wallet. Technical details: <${error?.message}>.`

/** The addresses at index 0, 1, 2... of `hdPathTemplate`, up to the first one not exported. */
const getExportedAddressesOnTemplate = (
  addressByHdPath: Map<string | undefined, string | undefined>,
  hdPathTemplate: HD_PATH_TEMPLATE_TYPE
) => {
  const addresses: string[] = []
  let nextAddress = addressByHdPath.get(getHdPathFromTemplate(hdPathTemplate, 0))
  while (nextAddress) {
    addresses.push(nextAddress)
    nextAddress = addressByHdPath.get(getHdPathFromTemplate(hdPathTemplate, addresses.length))
  }

  return addresses
}

/** What `HDNodeWallet.fromExtendedKey` gives back for a public (neutered) key. */
type AccountNode = ReturnType<typeof HDNodeWallet.fromExtendedKey>

class QrKeyIterator implements KeyIteratorInterface {
  type = 'qr' as const

  subType = 'hw' as const

  controller: QrHardwareController

  #parsedAccount?: ParsedQrAccount
  #xpub?: string
  /** The path the scanned wallet exported its extended public key from. */
  #originHdPath: string = DEFAULT_ORIGIN_HD_PATH
  #hdPathTemplate: HD_PATH_TEMPLATE_TYPE = BIP44_STANDARD_DERIVATION_TEMPLATE
  /**
   * The address at each index of `#hdPathTemplate`, when the wallet exported its accounts
   * one by one instead of an extended public key to derive them from (e.g. Ledger Live).
   */
  #exportedAddresses?: string[]

  get parsedAccount() {
    return this.#parsedAccount
  }

  get hdPathTemplate() {
    return this.#hdPathTemplate
  }

  get derivableHdPathTemplates() {
    if (this.#exportedAddresses) return [this.#hdPathTemplate]

    return getDerivableHdPathTemplates(this.#originHdPath)
  }

  get keysCount() {
    return this.#exportedAddresses?.length
  }

  constructor({ controller }: KeyIteratorProps) {
    if (!controller) throw new Error(MISSING_CONTROLLER_MSG)

    this.controller = controller
  }

  async initFromQrPayload(payload: string | Uint8Array) {
    if (!this.controller) {
      throw new ExternalSignerError('QR controller is not initialized.')
    }

    const parsed = await this.controller.parseAndSetAccountFromQR(payload)

    if (!parsed.accounts.length) {
      throw new ExternalSignerError('No accounts were found in the scanned QR payload.')
    }

    if (parsed.accounts.every(({ xpub }) => !xpub)) {
      this.#initFromExportedAccounts(parsed)
      return
    }

    if (parsed.accounts.length > 1) {
      throw new ExternalSignerError(
        'Multiple QR accounts are not supported yet in this import flow.'
      )
    }

    const originPath = parsed.hdPath || parsed.accounts[0]?.hdPath
    this.#originHdPath = normalizeOriginHdPath(originPath) || DEFAULT_ORIGIN_HD_PATH
    this.#hdPathTemplate = this.#resolveExportedHdPathTemplate(parsed.childrenPath)

    const firstAccount = parsed.accounts[0]

    if (!firstAccount?.xpub) {
      throw new ExternalSignerError(
        'The scanned QR account payload does not contain an extended public key.'
      )
    }

    this.#parsedAccount = parsed
    this.#xpub = firstAccount.xpub
  }

  /**
   * Takes in accounts the wallet exported one by one, which it does for the paths an
   * extended public key cannot derive (Ledger Live, whose account index is hardened). Only
   * these accounts can be browsed then, and only on the path they were exported from.
   */
  #initFromExportedAccounts(parsed: ParsedQrAccount) {
    const addressByHdPath = new Map(parsed.accounts.map(({ hdPath, addr }) => [hdPath, addr]))
    // Two accounts claiming the same path leave no way to tell which one is real
    if (addressByHdPath.size !== parsed.accounts.length) {
      throw new ExternalSignerError(DUPLICATE_EXPORTED_ACCOUNT_MSG)
    }

    // Accounts are saved by their index on the path, so the export has to be every index
    // from 0 on one path - anything else would leave an account out or save it at the
    // wrong index, which the wallet could then not sign with
    for (const { value: hdPathTemplate } of DERIVATION_OPTIONS) {
      const exportedAddresses = getExportedAddressesOnTemplate(addressByHdPath, hdPathTemplate)

      if (exportedAddresses.length === parsed.accounts.length) {
        this.#parsedAccount = parsed
        this.#hdPathTemplate = hdPathTemplate
        this.#exportedAddresses = exportedAddresses
        return
      }
    }

    throw new ExternalSignerError(UNSUPPORTED_EXPORTED_ACCOUNTS_MSG)
  }

  /**
   * Which of the derivation paths the scanned wallet actually exported. The wallet says
   * so in the children path, and it has to: the Ledger Legacy path and the standard one
   * are exported from the same account-level key, so the key alone cannot tell them
   * apart. Wallets that leave it out are taken to have exported the standard path.
   */
  #resolveExportedHdPathTemplate(childrenPath?: string): HD_PATH_TEMPLATE_TYPE {
    const exportedTemplate =
      childrenPath && childrenPath.split('*').length === 2
        ? (`${this.#originHdPath}/${childrenPath.split('*').join('<account>')}` as HD_PATH_TEMPLATE_TYPE)
        : null

    if (exportedTemplate && getHdPathTemplateRelativeToOrigin(this.#originHdPath, exportedTemplate))
      return exportedTemplate

    // Wallets export their key either at the account level or one level deeper, at the
    // standard chain - both of which the standard path branches off. Anything else is
    // a path of its own, which only the wallet that reported it can be browsed on.
    return getHdPathTemplateRelativeToOrigin(this.#originHdPath, BIP44_STANDARD_DERIVATION_TEMPLATE)
      ? BIP44_STANDARD_DERIVATION_TEMPLATE
      : (`${this.#originHdPath}/0/<account>` as HD_PATH_TEMPLATE_TYPE)
  }

  #deriveAddressFromRelativePath(accountNode: AccountNode, relativePath: string): string {
    try {
      return accountNode.derivePath(relativePath).address
    } catch (error: any) {
      throw new ExternalSignerError(getDerivationErrorMsg(error), { sendCrashReport: true })
    }
  }

  // Addresses are derived from the extended public key rather than from the wallet
  // itself, so the wanted path has to be expressed relative to the path that key
  // was exported from.
  #resolveRelativePathTemplate(
    hdPathTemplate: HD_PATH_TEMPLATE_TYPE = this.#hdPathTemplate
  ): string {
    const relativePathTemplate = getHdPathTemplateRelativeToOrigin(
      this.#originHdPath,
      hdPathTemplate
    )

    if (!relativePathTemplate) throw new ExternalSignerError(UNREACHABLE_HD_PATH_MSG)

    return relativePathTemplate
  }

  #buildRelativePath(index: number, relativePathTemplate: string): string {
    return relativePathTemplate.replace('<account>', String(index))
  }

  async retrieve(
    fromToArr: { from: number; to: number }[],
    hdPathTemplate?: HD_PATH_TEMPLATE_TYPE
  ): Promise<string[]> {
    if (!this.controller) throw new Error(MISSING_CONTROLLER_MSG)
    if (fromToArr.some(({ from, to }) => (!from && from !== 0) || (!to && to !== 0))) {
      throw new Error(INVALID_PARAMS_MSG)
    }
    const exportedAddresses = this.#exportedAddresses
    if (exportedAddresses) {
      if (hdPathTemplate && hdPathTemplate !== this.#hdPathTemplate) {
        throw new ExternalSignerError(UNREACHABLE_HD_PATH_MSG)
      }

      // There is nothing past the accounts the wallet exported, so the last page comes up short
      return fromToArr.flatMap(({ from, to }) => exportedAddresses.slice(from, to + 1))
    }
    if (!this.#parsedAccount || !this.#xpub) {
      throw new ExternalSignerError('QR accounts have not been imported yet.')
    }

    const relativePathTemplate = this.#resolveRelativePathTemplate(hdPathTemplate)

    // Parsed once per retrieval rather than for every address, which is a base58
    // decode each time
    let accountNode: AccountNode
    try {
      accountNode = HDNodeWallet.fromExtendedKey(this.#xpub)
    } catch (error: any) {
      throw new ExternalSignerError(getDerivationErrorMsg(error), { sendCrashReport: true })
    }

    const keys: string[] = []

    for (const { from, to } of fromToArr) {
      for (let i = from; i <= to; i++) {
        const relativePath = this.#buildRelativePath(i, relativePathTemplate)
        const derivedAddr = this.#deriveAddressFromRelativePath(accountNode, relativePath)
        keys.push(derivedAddr)
      }
    }

    return keys
  }
}

export default QrKeyIterator
