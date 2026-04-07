import { computeAddress, HDNodeWallet } from 'ethers'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import {
  BIP44_LEDGER_DERIVATION_TEMPLATE,
  HD_PATH_TEMPLATE_TYPE
} from '@ambire-common/consts/derivation'
import { KeyIterator as KeyIteratorInterface } from '@ambire-common/interfaces/keyIterator'
import { getMessageFromTrezorErrorCode } from '@ambire-common/libs/trezor/trezor'
import { getHdPathFromTemplate, getParentHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import { TrezorConnect } from '@web/modules/hardware-wallet/controllers/TrezorController'

interface KeyIteratorProps {
  walletSDK: TrezorConnect
}

/**
 * Serves for retrieving a range of addresses/keys from a Trezor hardware wallet
 */
class TrezorKeyIterator implements KeyIteratorInterface {
  type = 'trezor' as 'trezor'

  subType = 'hw' as 'hw'

  #walletSDK: KeyIteratorProps['walletSDK']

  // Cache the extended public key that would allow calculating all addresses
  // in the range, to avoid unnecessary requests to the Trezor device.
  // For every HD_PATH_TEMPLATE_TYPE the xpub needed (parent) is different.
  #xpubs: Partial<Record<HD_PATH_TEMPLATE_TYPE, string>> = {}

  constructor({ walletSDK }: KeyIteratorProps) {
    if (!walletSDK) throw new Error('trezorKeyIterator: missing walletSDK prop')

    this.#walletSDK = walletSDK
  }

  #deriveAddressFromXpub(index: number, hdPathTemplate: HD_PATH_TEMPLATE_TYPE): string {
    if (!this.#xpubs[hdPathTemplate])
      throw new ExternalSignerError(
        'Could not generate an Ethereum address because the extended public key is missing.'
      )

    try {
      const hdNode = HDNodeWallet.fromExtendedKey(this.#xpubs[hdPathTemplate])
      const childNode = hdNode.deriveChild(index)

      return childNode.address
    } catch (error: any) {
      throw new ExternalSignerError(
        `Could not generate Ethereum address from the extended public key received from your Trezor device. Technical details: <${error?.message}>.`,
        {
          sendCrashReport: true
        }
      )
    }
  }

  #deriveAddressFromPublicKey(publicKey: string): string {
    if (!publicKey)
      throw new ExternalSignerError(
        'Could not generate an Ethereum address because the public key is missing.'
      )

    try {
      return computeAddress(publicKey.startsWith('0x') ? publicKey : `0x${publicKey}`)
    } catch (error: any) {
      throw new ExternalSignerError(
        `Could not generate Ethereum address from the public key received from your Trezor device. Technical details: <${error?.message}>.`,
        {
          sendCrashReport: true
        }
      )
    }
  }

  async retrieve(
    fromToArr: { from: number; to: number }[],
    hdPathTemplate?: HD_PATH_TEMPLATE_TYPE
  ) {
    if (!this.#walletSDK) throw new Error('trezorKeyIterator: walletSDK not initialized')
    if (!hdPathTemplate) throw new Error('trezorKeyIterator: missing hdPathTemplate')

    const addrBundleToBeRequested: { path: string; index: number }[] = []
    fromToArr.forEach(({ from, to }) => {
      if ((!from && from !== 0) || (!to && to !== 0))
        throw new Error('trezorKeyIterator: invalid or missing arguments')

      for (let i = from; i <= to; i++) {
        const path = getHdPathFromTemplate(hdPathTemplate, i)
        addrBundleToBeRequested.push({ path, index: i })
      }
    })

    // Ledger Live varies the hardened account segment (`<account>'`), so unlike
    // the standard BIP44 path we cannot start from the parent xpub at m/44'/60'
    // and derive children locally. We must request the full public key for each
    // concrete path from the device and then compute the Ethereum address from it.
    if (hdPathTemplate === BIP44_LEDGER_DERIVATION_TEMPLATE) {
      try {
        const res = await this.#walletSDK.getPublicKey({
          bundle: addrBundleToBeRequested.map(({ path }) => ({
            coin: 'ETH',
            path,
            showOnTrezor: false
          }))
        })

        if (!res.success)
          throw new ExternalSignerError(
            getMessageFromTrezorErrorCode(res.payload.code, res.payload.error)
          )

        if (res.payload.length !== addrBundleToBeRequested.length)
          throw new ExternalSignerError(
            `Could not receive the expected number of public keys from your Trezor device. Technical details: <Expected ${addrBundleToBeRequested.length}, received ${res.payload.length}>.`,
            { sendCrashReport: true }
          )

        return res.payload.map(({ publicKey }) => this.#deriveAddressFromPublicKey(publicKey))
      } catch (error: any) {
        if (error instanceof ExternalSignerError) throw error

        throw new ExternalSignerError(
          `Could not receive the public keys from your Trezor device. Technical details: <${error?.message}>.`,
          { sendCrashReport: true }
        )
      }
    }

    if (!this.#xpubs[hdPathTemplate]) {
      const parentPath = getParentHdPathFromTemplate(hdPathTemplate)
      if (!parentPath)
        throw new ExternalSignerError(
          `Could not receive the extended public key from your Trezor device. Technical details: <Parent path not found for ${hdPathTemplate}>.`,
          { sendCrashReport: true }
        )

      try {
        const res = await this.#walletSDK.getPublicKey({
          coin: 'ETH',
          path: parentPath,
          showOnTrezor: false
        })

        if (!res.success)
          throw new ExternalSignerError(
            getMessageFromTrezorErrorCode(res.payload.code, res.payload.error)
          )

        this.#xpubs[hdPathTemplate] = res.payload.xpub
      } catch (error: any) {
        if (error instanceof ExternalSignerError) throw error

        throw new ExternalSignerError(
          `Could not receive the extended public key from your Trezor device. Technical details: <${error?.message}>.`,
          { sendCrashReport: true }
        )
      }
    }

    return addrBundleToBeRequested.map(({ index }) =>
      this.#deriveAddressFromXpub(index, hdPathTemplate)
    )
  }
}

export default TrezorKeyIterator
