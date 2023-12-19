import { Signature, Transaction, TransactionLike } from 'ethers'

import { ExternalKey, KeystoreSigner } from '@ambire-common/interfaces/keystore'
import { addHexPrefix } from '@ambire-common/utils/addHexPrefix'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import { stripHexPrefix } from '@ambire-common/utils/stripHexPrefix'
import LedgerController, {
  ledgerService
} from '@web/modules/hardware-wallet/controllers/LedgerController'

class LedgerSigner implements KeystoreSigner {
  key: ExternalKey

  controller: LedgerController | null = null

  constructor(_key: ExternalKey) {
    this.key = _key
  }

  // TODO: the ExternalSignerController type is missing some properties from
  // type 'LedgerController', sync the types mismatch
  // @ts-ignore
  init(externalDeviceController?: LedgerController) {
    if (!externalDeviceController) {
      throw new Error('ledgerSigner: externalDeviceController not initialized')
    }

    this.controller = externalDeviceController
  }

  #prepareForSigning = async () => {
    if (!this.controller) {
      throw new Error(
        'Something went wrong when preparing Ledger to sign. Please try again or contact support if the problem persists.'
      )
    }

    const path = getHdPathFromTemplate(this.key.meta.hdPathTemplate, this.key.meta.index)
    await this.controller.unlock(path, this.key.addr)

    // After unlocking, SDK instance should always be present, double-check here
    if (!this.controller.walletSDK) {
      throw new Error(
        'Something went wrong when preparing Ledger to sign. Please try again or contact support if the problem persists.'
      )
    }

    if (!this.controller.isUnlocked(path, this.key.addr)) {
      throw new Error(
        `The Ledger is unlocked, but with different seed or passphrase, because the address of the retrieved key is different than the key expected (${this.key.addr})`
      )
    }
  }

  signRawTransaction: KeystoreSigner['signRawTransaction'] = async (txnRequest) => {
    await this.#prepareForSigning()

    // In case `maxFeePerGas` is provided, it is a EIP-1559 transaction,
    // otherwise - it's a legacy one.
    const type = typeof txnRequest.maxFeePerGas === 'bigint' ? 2 : 0

    try {
      const unsignedTxn: TransactionLike = { ...txnRequest, type }

      const unsignedSerializedTxn = Transaction.from(unsignedTxn).unsignedSerialized

      // Look for resolutions for external plugins and ERC20
      const resolution = await ledgerService.resolveTransaction(
        stripHexPrefix(unsignedSerializedTxn),
        this.controller!.walletSDK!.loadConfig,
        {
          externalPlugins: true,
          erc20: true,
          nft: true
        }
      )

      const path = getHdPathFromTemplate(this.key.meta.hdPathTemplate, this.key.meta.index)
      const res = await this.controller!.walletSDK!.signTransaction(
        path,
        stripHexPrefix(unsignedSerializedTxn),
        resolution
      )

      const signature = Signature.from({
        r: addHexPrefix(res.r),
        s: addHexPrefix(res.s),
        v: Signature.getNormalizedV(res.v)
      })
      const signedSerializedTxn = Transaction.from({
        ...unsignedTxn,
        signature
      }).serialized

      return signedSerializedTxn
    } catch (e: any) {
      throw new Error(e?.message || 'ledgerSigner: singing failed for unknown reason')
    }
  }

  signTypedData: KeystoreSigner['signTypedData'] = async ({
    domain,
    types,
    message,
    primaryType
  }) => {
    await this.#prepareForSigning()

    try {
      const path = getHdPathFromTemplate(this.key.meta.hdPathTemplate, this.key.meta.index)
      const rsvRes = await this.controller!.walletSDK!.signEIP712Message(path, {
        domain,
        types,
        message,
        primaryType
      })

      const signature = addHexPrefix(`${rsvRes.r}${rsvRes.s}${rsvRes.v.toString(16)}`)
      return signature
    } catch (e: any) {
      throw new Error(
        e?.message ||
          'Signing the typed data message failed. Please try again or contact Ambire support if issue persists.'
      )
    }
  }

  signMessage: KeystoreSigner['signMessage'] = async (hex) => {
    if (!stripHexPrefix(hex)) {
      throw new Error(
        'Request for signing an empty message detected. Signing empty messages with Ambire is disallowed.'
      )
    }

    await this.#prepareForSigning()

    try {
      const path = getHdPathFromTemplate(this.key.meta.hdPathTemplate, this.key.meta.index)
      const rsvRes = await this.controller!.walletSDK!.signPersonalMessage(
        path,
        stripHexPrefix(hex)
      )

      const signature = addHexPrefix(`${rsvRes?.r}${rsvRes?.s}${rsvRes?.v.toString(16)}`)
      return signature
    } catch (e: any) {
      throw new Error(
        e?.message ||
          'Signing the message failed. Please try again or contact Ambire support if issue persists.'
      )
    }
  }
}

export default LedgerSigner
