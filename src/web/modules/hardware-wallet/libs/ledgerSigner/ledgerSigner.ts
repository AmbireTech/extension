import { stripHexPrefix } from 'ethereumjs-util'
import { Signature, Transaction, TransactionLike } from 'ethers'

import { ExternalKey, KeystoreSigner } from '@ambire-common/interfaces/keystore'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import LedgerController from '@web/modules/hardware-wallet/controllers/LedgerController'

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

  signRawTransaction: KeystoreSigner['signRawTransaction'] = async (txnRequest) => {
    if (!this.controller) {
      throw new Error('ledgerSigner: ledgerController not initialized')
    }

    await this.controller.reconnect()

    await this.controller.unlock(
      getHdPathFromTemplate(this.key.meta.hdPathTemplate, this.key.meta.index)
    )

    try {
      const unsignedTxn: TransactionLike = {
        ...txnRequest,
        // TODO: Temporary use the legacy transaction mode, because Ambire
        // extension doesn't support EIP-1559 yet (type: `2`)
        type: 0
      }

      const unsignedSerializedTxn = Transaction.from(unsignedTxn).unsignedSerialized

      const res = await this.controller.app!.signTransaction(
        getHdPathFromTemplate(this.key.meta.hdPathTemplate, this.key.meta.index),
        stripHexPrefix(unsignedSerializedTxn)
      )

      const signature = Signature.from({
        r: `0x${res.r}`,
        s: `0x${res.s}`,
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
    if (!this.controller) {
      throw new Error(
        'Something went wrong with triggering the sign message mechanism. Please try again or contact support if the problem persists.'
      )
    }

    await this.controller.unlock(
      getHdPathFromTemplate(this.key.meta.hdPathTemplate, this.key.meta.index)
    )

    try {
      const rsvRes = await this.controller.app!.signEIP712Message(
        getHdPathFromTemplate(this.key.meta.hdPathTemplate, this.key.meta.index),
        {
          domain,
          types,
          message,
          primaryType
        }
      )

      const signature = `0x${rsvRes.r}${rsvRes.s}${rsvRes.v.toString(16)}`
      return signature
    } catch (e: any) {
      throw new Error(
        e?.message ||
          'Signing the typed data message failed. Please try again or contact Ambire support if issue persists.'
      )
    }
  }

  signMessage: KeystoreSigner['signMessage'] = async (hex) => {
    if (!this.controller) {
      throw new Error(
        'Something went wrong with triggering the sign message mechanism. Please try again or contact support if the problem persists.'
      )
    }

    if (!stripHexPrefix(hex)) {
      throw new Error(
        'Request for signing an empty message detected. Signing empty messages with Ambire is disallowed.'
      )
    }

    await this.controller.unlock(
      getHdPathFromTemplate(this.key.meta.hdPathTemplate, this.key.meta.index)
    )

    try {
      const rsvRes = await this.controller.app!.signPersonalMessage(
        getHdPathFromTemplate(this.key.meta.hdPathTemplate, this.key.meta.index),
        stripHexPrefix(hex)
      )

      const signature = `0x${rsvRes?.r}${rsvRes?.s}${rsvRes?.v.toString(16)}`
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
