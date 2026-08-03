import {
  getBytes,
  hashMessage,
  Signature,
  Transaction,
  TransactionLike,
  TypedDataEncoder
} from 'ethers'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { ExternalKey, KeystoreSignerInterface } from '@ambire-common/interfaces/keystore'
import { TypedMessageUserRequest } from '@ambire-common/interfaces/userRequest'
import { addHexPrefix } from '@ambire-common/utils/addHexPrefix'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import { stripHexPrefix } from '@ambire-common/utils/stripHexPrefix'
import { NfcControllerInterface } from '@common/modules/hardware-wallets/nfc/interfaces/nfcController'
import { NfcSignature } from '@common/modules/hardware-wallets/nfc/types'

/**
 * The NfcHardwareSigner signs with NFC (tap-to-sign) cards.
 *
 * Cards sign a raw 32-byte hash and nothing else - they have no notion of
 * transactions or EIP-712 messages. So this signer computes every hash itself
 * and delegates only the elliptic curve part to the card, through the controller.
 */
class NfcHardwareSigner implements KeystoreSignerInterface {
  key: ExternalKey & { isExternallyStored: boolean }

  controller: NfcControllerInterface | null = null

  constructor(_key: ExternalKey) {
    this.key = { ..._key, isExternallyStored: true }
  }

  // @ts-expect-error param is the concrete NfcControllerInterface, not the interface
  init(externalDeviceController?: NfcControllerInterface) {
    if (!externalDeviceController) {
      throw new ExternalSignerError('nfcSigner: externalDeviceController not initialized', {
        sendCrashReport: true
      })
    }

    this.controller = externalDeviceController
  }

  #signHash = async (hashHex: string): Promise<NfcSignature> => {
    if (!this.controller) {
      throw new ExternalSignerError('Something went wrong when preparing the card to sign.', {
        sendCrashReport: true
      })
    }

    return this.controller.signHash({
      hashHex,
      path: getHdPathFromTemplate(this.key.meta.hdPathTemplate, this.key.meta.index),
      expectedKeyUid: this.key.meta.deviceId
    })
  }

  #normalizeSignature(signature: NfcSignature): string {
    return addHexPrefix(
      `${stripHexPrefix(signature.r)}${stripHexPrefix(signature.s)}${signature.v.toString(16)}`
    )
  }

  signMessage: KeystoreSignerInterface['signMessage'] = async (hex) => {
    if (!stripHexPrefix(hex)) {
      throw new ExternalSignerError(
        'Request for signing an empty message detected. Signing empty messages with Ambire is disallowed.'
      )
    }

    try {
      // personal_sign: the message gets the standard Ethereum prefix before hashing
      const signature = await this.#signHash(hashMessage(getBytes(addHexPrefix(hex))))

      return this.#normalizeSignature(signature)
    } catch (e: any) {
      throw new ExternalSignerError(e?.message || 'Signing the message with the card failed.', {
        sendCrashReport: e instanceof ExternalSignerError ? e.sendCrashReport : true
      })
    }
  }

  signTypedData: KeystoreSignerInterface['signTypedData'] = async (typedData) => {
    try {
      const signature = await this.#signHash(NfcHardwareSigner.getTypedDataHash(typedData))

      return this.#normalizeSignature(signature)
    } catch (e: any) {
      throw new ExternalSignerError(
        e?.message || 'Signing the typed data message with the card failed.',
        { sendCrashReport: e instanceof ExternalSignerError ? e.sendCrashReport : true }
      )
    }
  }

  static getTypedDataHash(typedData: TypedMessageUserRequest['meta']['params']): string {
    // ethers derives the primary type on its own and rejects the EIP712Domain entry
    const typesWithoutDomain = Object.fromEntries(
      Object.entries(typedData.types).filter(([typeName]) => typeName !== 'EIP712Domain')
    )

    return TypedDataEncoder.hash(typedData.domain, typesWithoutDomain, typedData.message)
  }

  signRawTransaction: KeystoreSignerInterface['signRawTransaction'] = async (txnRequest) => {
    // In case `maxFeePerGas` is provided, treat as an EIP-1559 transaction,
    // since there's no other better way to distinguish between the two in here.
    const type = typeof txnRequest.maxFeePerGas === 'bigint' ? 2 : 0

    try {
      const unsignedTxn: TransactionLike = { ...txnRequest, type }
      const unsignedHash = Transaction.from(unsignedTxn).unsignedHash

      const res = await this.#signHash(unsignedHash)

      const signature = Signature.from({
        r: res.r,
        s: res.s,
        v: Signature.getNormalizedV(res.v)
      })

      return Transaction.from({ ...unsignedTxn, signature }).serialized
    } catch (e: any) {
      throw new ExternalSignerError(e?.message || 'Signing the transaction with the card failed.', {
        sendCrashReport: e instanceof ExternalSignerError ? e.sendCrashReport : true
      })
    }
  }

  sign7702: KeystoreSignerInterface['sign7702'] = () => {
    throw new Error('not supported')
  }

  signTransactionTypeFour: KeystoreSignerInterface['signTransactionTypeFour'] = () => {
    throw new Error('not supported')
  }

  async signingCleanup() {
    await this.controller?.signingCleanup?.()
  }
}

export default NfcHardwareSigner
