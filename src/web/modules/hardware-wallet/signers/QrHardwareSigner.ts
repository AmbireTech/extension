import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import {
  ExternalKey,
  ExternalSignerController,
  KeystoreSignerInterface
} from '@ambire-common/interfaces/keystore'
import { getHdPathFromTemplate } from '@ambire-common/utils/hdPath'
import { normalizeSignatureHex } from '@ambire-common/utils/normalizeSignatureHex'
import QrHardwareController from '@web/modules/hardware-wallet/controllers/QrHardwareController'

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

  signMessage: KeystoreSignerInterface['signMessage'] = async (hex) => {
    await this.#prepareForSigning()

    try {
      const path = getHdPathFromTemplate(this.key.meta.hdPathTemplate, this.key.meta.index)

      const res = await this.controller!.signMessageQR({
        hex,
        derivationPath: path,
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

  signRawTransaction: KeystoreSignerInterface['signRawTransaction'] = async (_txnRequest) => {
    throw new Error('Not implemented yet')
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
