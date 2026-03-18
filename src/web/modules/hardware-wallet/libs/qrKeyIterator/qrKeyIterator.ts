import { HDNodeWallet } from 'ethers'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { HD_PATH_TEMPLATE_TYPE } from '@ambire-common/consts/derivation'
import {
  KeyIterator as KeyIteratorInterface,
  QrWalletConfig
} from '@ambire-common/interfaces/keyIterator'
import { ParsedQrAccount } from '@ambire-common/interfaces/keystore'
import QrHardwareController from '@web/modules/hardware-wallet/controllers/QrHardwareController'

import { getRelativePathTemplateFromOrigin } from '../../qr/utils'
import { QrWalletRegistry, QrWalletType } from '../../qr/wallets'

interface KeyIteratorProps {
  controller: QrHardwareController
  walletType: QrWalletType
}

const MISSING_CONTROLLER_MSG =
  'Unable to interact with the QR hardware wallet. The QR controller is missing.'
const INVALID_PARAMS_MSG = 'Unable to retrieve keys because of invalid parameters received.'

class QrKeyIterator implements KeyIteratorInterface {
  type = 'qr' as const

  subType = 'hw' as const

  controller: QrHardwareController
  walletConfig: QrWalletConfig | undefined = undefined

  #parsedAccount?: ParsedQrAccount
  #xpub?: string
  #importedHdPath?: string

  get parsedAccount() {
    return this.#parsedAccount
  }

  constructor({ controller }: KeyIteratorProps) {
    if (!controller) throw new Error(MISSING_CONTROLLER_MSG)

    this.controller = controller
  }

  async importAccount(payload: string | Uint8Array) {
    if (!this.controller) {
      throw new ExternalSignerError('QR controller is not initialized.')
    }

    const parsed = await this.controller.importAccountQR(payload)

    if (!parsed.accounts.length) {
      throw new ExternalSignerError('No accounts were found in the scanned QR payload.')
    }

    if (parsed.accounts.length > 1) {
      throw new ExternalSignerError(
        'Multiple QR accounts are not supported yet in this import flow.'
      )
    }

    const walletType = parsed.walletType || 'keystone' // TODO: fix the default value
    const wallet = QrWalletRegistry[walletType]

    if (!wallet) {
      throw new ExternalSignerError(`Unsupported QR wallet type: ${walletType}`)
    }

    const originPath = parsed.accounts[0]?.hdPath || parsed.hdPath
    const relativePathTemplate = getRelativePathTemplateFromOrigin(originPath)

    this.walletConfig = {
      ...wallet,
      relativePathTemplate
    }

    const firstAccount = parsed.accounts[0]

    if (!firstAccount?.xpub) {
      throw new ExternalSignerError(
        'The scanned QR account payload does not contain an extended public key.'
      )
    }

    this.#parsedAccount = parsed
    this.#xpub = firstAccount.xpub
    this.#importedHdPath = firstAccount.hdPath || parsed.hdPath
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

  getSigningDerivationPath(index: number) {
    if (!this.walletConfig) {
      throw new ExternalSignerError('QR wallet configuration not resolved')
    }

    const relative = this.walletConfig.relativePathTemplate.replace('{index}', String(index))

    return this.walletConfig.hdPathTemplate.replace('<account>', relative)
  }

  #buildRelativePath(index: number): string {
    if (!this.walletConfig) {
      throw new ExternalSignerError('QR wallet configuration has not been resolved yet.')
    }

    return this.walletConfig.relativePathTemplate.replace('{index}', String(index))
  }

  async retrieve(
    fromToArr: { from: number; to: number }[],
    hdPathTemplate?: HD_PATH_TEMPLATE_TYPE
  ): Promise<string[]> {
    if (!this.walletConfig) {
      throw new ExternalSignerError('QR wallet configuration has not been resolved yet.')
    }
    if (!this.controller) throw new Error(MISSING_CONTROLLER_MSG)
    if (!this.#parsedAccount || !this.#xpub) {
      throw new ExternalSignerError('QR accounts have not been imported yet.')
    }

    const keys: string[] = []

    for (const { from, to } of fromToArr) {
      if ((!from && from !== 0) || (!to && to !== 0)) {
        throw new Error(INVALID_PARAMS_MSG)
      }

      for (let i = from; i <= to; i++) {
        const relativePath = this.#buildRelativePath(i)
        const derivedAddr = this.#deriveAddressFromRelativePath(relativePath)
        keys.push(derivedAddr)
      }
    }

    return keys
  }
}

export default QrKeyIterator
