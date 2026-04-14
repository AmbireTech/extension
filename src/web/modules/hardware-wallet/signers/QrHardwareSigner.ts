import { Signature, Transaction, TransactionLike } from 'ethers'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import {
  ExternalKey,
  ExternalSignerController,
  KeystoreSignerInterface
} from '@ambire-common/interfaces/keystore'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import { normalizeSignatureHex } from '@ambire-common/utils/normalizeSignatureHex'
import QrHardwareController from '@web/modules/hardware-wallet/controllers/QrHardwareController'

/**
 * The QrHardwareSigner is responsible for signing data with QR-based hardware wallets.
 * It integrates with Ambire's keystore signer flow and delegates the actual QR request /
 * response exchange to the QrHardwareController.
 *
 * Its responsibilities include:
 * - building the correct derivation path for the selected QR wallet account
 * - initiating QR-based signing for messages, typed data, and raw transactions
 * - normalizing returned QR signatures into formats usable by Ambire
 * - reconstructing signed transactions from the returned signature payload
 *
 * Unlike SDK/transport-based signers, this signer does not communicate with the hardware
 * wallet directly. Instead, it relies on the QR controller to drive the interactive
 * request → scan → response signing flow.
 */
class QrHardwareSigner implements KeystoreSignerInterface {
  key: ExternalKey & { isExternallyStored: boolean }

  controller: QrHardwareController | null = null

  constructor(_key: ExternalKey) {
    this.key = { ..._key, isExternallyStored: true }
  }

  init(externalDeviceController?: ExternalSignerController) {
    if (!externalDeviceController) {
      throw new ExternalSignerError('qrSigner: externalDeviceController not initialized', {
        sendCrashReport: true
      })
    }

    this.controller = externalDeviceController as QrHardwareController
  }

  #prepareForSigning = async () => {
    if (!this.controller) {
      throw new ExternalSignerError(
        'Something went wrong when preparing the QR hardware wallet to sign.',
        { sendCrashReport: true }
      )
    }
  }

  #getDerivationPath = () => {
    const { hdPathTemplate, index } = this.key.meta

    return getHdPathFromTemplate(hdPathTemplate, index)
  }

  signMessage: KeystoreSignerInterface['signMessage'] = async (hex) => {
    await this.#prepareForSigning()

    try {
      const path = this.#getDerivationPath()

      const res = await this.controller!.signMessageQR({
        hex,
        derivationPath: path,
        masterFingerprint: this.key.meta.masterFingerprint || '',
        address: this.key.addr
      })

      return 'signature' in res
        ? normalizeSignatureHex({ hex: res.signature })
        : normalizeSignatureHex(res)
    } catch (e: any) {
      throw new ExternalSignerError(e?.message || 'QR signing failed', {
        sendCrashReport: e instanceof ExternalSignerError ? e.sendCrashReport : true
      })
    }
  }

  signTypedData: KeystoreSignerInterface['signTypedData'] = async (typedData) => {
    await this.#prepareForSigning()

    try {
      const path = getHdPathFromTemplate(this.key.meta.hdPathTemplate, this.key.meta.index)

      const res = await this.controller!.signTypedDataQR({
        typedData,
        derivationPath: path,
        // TODO: check if masterFingerprint can be ''
        masterFingerprint: this.key.meta.masterFingerprint || '',
        address: this.key.addr
      })

      return 'signature' in res
        ? normalizeSignatureHex({ hex: res.signature })
        : normalizeSignatureHex(res)
    } catch (e: any) {
      throw new ExternalSignerError(e?.message || 'QR typed data signing failed', {
        sendCrashReport: e instanceof ExternalSignerError ? e.sendCrashReport : true
      })
    }
  }

  signRawTransaction: KeystoreSignerInterface['signRawTransaction'] = async (txnRequest) => {
    await this.#prepareForSigning()

    try {
      const path = this.#getDerivationPath()

      const type = typeof txnRequest.maxFeePerGas === 'bigint' ? 2 : 0
      const unsignedTxn: TransactionLike = { ...txnRequest, type }
      const unsignedSerializedTxn = Transaction.from(unsignedTxn).unsignedSerialized

      const res = await this.controller!.signTransactionQR({
        txHex: unsignedSerializedTxn,
        derivationPath: path,
        masterFingerprint: this.key.meta.masterFingerprint || '',
        address: this.key.addr,
        chainId: txnRequest.chainId,
        type
      })

      const hexSignature = 'signature' in res ? res.signature : normalizeSignatureHex(res)
      const signature = Signature.from(hexSignature)

      return Transaction.from({
        ...unsignedTxn,
        signature
      }).serialized
    } catch (e: any) {
      throw new ExternalSignerError(e?.message || 'QR transaction signing failed', {
        sendCrashReport: e instanceof ExternalSignerError ? e.sendCrashReport : true
      })
    }
  }

  sign7702 = () => {
    throw new Error('not supported')
  }

  signTransactionTypeFour = () => {
    throw new Error('not supported')
  }

  async signingCleanup() {
    await this.controller?.signingCleanup?.()
  }
}

export default QrHardwareSigner
