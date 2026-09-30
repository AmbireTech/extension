import { getAddress, Signature, toBeHex, Transaction } from 'ethers'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import {
  ExternalKey,
  ExternalSignerController,
  KeystoreSignerInterface
} from '@ambire-common/interfaces/keystore'
import { TypedMessageUserRequest } from '@ambire-common/interfaces/userRequest'
import { addHexPrefix } from '@ambire-common/utils/addHexPrefix'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import { stripHexPrefix } from '@ambire-common/utils/stripHexPrefix'
import transformTypedData from '@trezor/connect-plugin-ethereum'
import OneKeyController, {
  getResponsePayload
} from '@web/modules/hardware-wallet/controllers/OneKeyController/OneKeyController'

class OneKeySigner implements KeystoreSignerInterface {
  key: ExternalKey & { isExternallyStored: boolean }

  controller: OneKeyController | null = null

  constructor(key: ExternalKey) {
    this.key = { ...key, isExternallyStored: true }
  }

  init(externalDeviceController?: ExternalSignerController) {
    if (!externalDeviceController) {
      throw new ExternalSignerError('The OneKey connection is not initialized.', {
        sendCrashReport: true
      })
    }

    this.controller = externalDeviceController as OneKeyController
  }

  async #prepareForSigning() {
    if (!this.controller) throw new ExternalSignerError('The OneKey connection is not initialized.')

    await this.controller.initialLoadPromise
    const path = getHdPathFromTemplate(this.key.meta.hdPathTemplate, this.key.meta.index)
    await this.controller.unlock(path, this.key.addr)
    return path
  }

  #validateAddress(address: string) {
    if (getAddress(address) !== getAddress(this.key.addr)) {
      throw new ExternalSignerError(
        'The connected OneKey device or passphrase does not match the key selected for signing.'
      )
    }
  }

  signRawTransaction: KeystoreSignerInterface['signRawTransaction'] = async (txnRequest) => {
    if (typeof txnRequest.value === 'undefined') {
      throw new ExternalSignerError('The transaction value is missing.', { sendCrashReport: true })
    }

    const path = await this.#prepareForSigning()
    const isEip1559 = typeof txnRequest.maxFeePerGas === 'bigint'
    const transaction = {
      to: txnRequest.to || '',
      value: toBeHex(txnRequest.value),
      gasLimit: toBeHex(txnRequest.gasLimit),
      gasPrice: isEip1559 ? undefined : toBeHex(txnRequest.gasPrice || 0n),
      maxFeePerGas: isEip1559 ? toBeHex(txnRequest.maxFeePerGas!) : undefined,
      maxPriorityFeePerGas: isEip1559 ? toBeHex(txnRequest.maxPriorityFeePerGas || 0n) : undefined,
      nonce: toBeHex(txnRequest.nonce),
      data: txnRequest.data,
      chainId: Number(txnRequest.chainId)
    }
    const response = await this.controller!.walletSDK.evmSignTransaction(
      this.controller!.connectId,
      this.controller!.deviceId,
      { path, passphraseState: this.controller!.passphraseState, transaction }
    )
    const payload = getResponsePayload(response, 'transaction signing')
    const signature = Signature.from({
      r: addHexPrefix(payload.r),
      s: addHexPrefix(payload.s),
      v: Signature.getNormalizedV(payload.v)
    })
    const signedTransaction = Transaction.from({
      ...transaction,
      to: txnRequest.to ?? null,
      nonce: txnRequest.nonce,
      type: isEip1559 ? 2 : 0,
      signature
    })
    if (!signedTransaction.from) throw new Error('The OneKey signature could not be validated.')
    this.#validateAddress(signedTransaction.from)

    return signedTransaction.serialized
  }

  signTypedData: KeystoreSignerInterface['signTypedData'] = async ({
    domain: originalDomain,
    types: originalTypes,
    message,
    primaryType
  }: TypedMessageUserRequest['meta']['params']) => {
    const path = await this.#prepareForSigning()
    const types = { ...originalTypes, EIP712Domain: originalTypes.EIP712Domain ?? [] }
    const domain = {
      name: originalDomain.name ?? undefined,
      version: originalDomain.version ?? undefined,
      chainId: originalDomain.chainId ? Number(originalDomain.chainId) : undefined,
      verifyingContract: originalDomain.verifyingContract ?? undefined,
      salt: (originalDomain.salt ?? undefined) as ArrayBuffer | undefined
    }
    const data = {
      domain,
      types,
      message,
      primaryType: primaryType as keyof typeof types
    }
    const hashes = transformTypedData(data, true)
    const response = await this.controller!.walletSDK.evmSignTypedData(
      this.controller!.connectId,
      this.controller!.deviceId,
      {
        path,
        passphraseState: this.controller!.passphraseState,
        data,
        metamaskV4Compat: true,
        domainHash: hashes.domain_separator_hash ?? undefined,
        messageHash: hashes.message_hash ?? undefined,
        chainId: domain.chainId
      }
    )
    const payload = getResponsePayload(response, 'typed message signing')
    this.#validateAddress(payload.address)
    return addHexPrefix(payload.signature)
  }

  signMessage: KeystoreSignerInterface['signMessage'] = async (hex) => {
    const path = await this.#prepareForSigning()
    const response = await this.controller!.walletSDK.evmSignMessage(
      this.controller!.connectId,
      this.controller!.deviceId,
      {
        path,
        passphraseState: this.controller!.passphraseState,
        messageHex: stripHexPrefix(hex)
      }
    )
    const payload = getResponsePayload(response, 'message signing')
    this.#validateAddress(payload.address)
    return addHexPrefix(payload.signature)
  }

  sign7702: KeystoreSignerInterface['sign7702'] = ({ contract }) => {
    throw new Error('OneKey does not support EIP-7702 signing.', { cause: contract })
  }

  signTransactionTypeFour: KeystoreSignerInterface['signTransactionTypeFour'] = ({
    eip7702Auth
  }) => {
    throw new Error('OneKey does not support type-four transaction signing.', {
      cause: eip7702Auth
    })
  }
}

export default OneKeySigner
