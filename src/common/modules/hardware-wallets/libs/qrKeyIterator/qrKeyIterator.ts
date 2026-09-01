import { HDNodeWallet } from 'ethers'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import {
  BIP44_STANDARD_DERIVATION_TEMPLATE,
  HD_PATH_TEMPLATE_TYPE
} from '@ambire-common/consts/derivation'
import { KeyIterator as KeyIteratorInterface } from '@ambire-common/interfaces/keyIterator'
import { ParsedQrAccount } from '@ambire-common/interfaces/keystore'
import {
  getDerivableHdPathTemplates,
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

class QrKeyIterator implements KeyIteratorInterface {
  type = 'qr' as const

  subType = 'hw' as const

  controller: QrHardwareController

  #parsedAccount?: ParsedQrAccount
  #xpub?: string
  /** The path the scanned wallet exported its extended public key from. */
  #originHdPath: string = DEFAULT_ORIGIN_HD_PATH
  #hdPathTemplate: HD_PATH_TEMPLATE_TYPE = BIP44_STANDARD_DERIVATION_TEMPLATE

  get parsedAccount() {
    return this.#parsedAccount
  }

  get hdPathTemplate() {
    return this.#hdPathTemplate
  }

  get derivableHdPathTemplates() {
    return getDerivableHdPathTemplates(this.#originHdPath)
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

  #deriveAddressFromRelativePath(relativePath: string): string {
    if (!this.#xpub) {
      throw new ExternalSignerError(
        'Could not generate an Ethereum address because the extended public key is missing.'
      )
    }

    try {
      const hdNode = HDNodeWallet.fromExtendedKey(this.#xpub)
      const childNode = hdNode.derivePath(relativePath)

      return childNode.address
    } catch (error: any) {
      throw new ExternalSignerError(
        `Could not generate Ethereum address from the extended public key received from the QR wallet. Technical details: <${error?.message}>.`,
        {
          sendCrashReport: true
        }
      )
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

    if (!relativePathTemplate) {
      throw new ExternalSignerError(
        'This derivation path cannot be browsed with the account that was scanned from your QR wallet. Please pick another one.'
      )
    }

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
    if (!this.#parsedAccount || !this.#xpub) {
      throw new ExternalSignerError('QR accounts have not been imported yet.')
    }

    const relativePathTemplate = this.#resolveRelativePathTemplate(hdPathTemplate)
    const keys: string[] = []

    for (const { from, to } of fromToArr) {
      if ((!from && from !== 0) || (!to && to !== 0)) {
        throw new Error(INVALID_PARAMS_MSG)
      }

      for (let i = from; i <= to; i++) {
        const relativePath = this.#buildRelativePath(i, relativePathTemplate)
        const derivedAddr = this.#deriveAddressFromRelativePath(relativePath)
        keys.push(derivedAddr)
      }
    }

    return keys
  }
}

export default QrKeyIterator
