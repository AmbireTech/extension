import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import EventEmitter from '@ambire-common/controllers/eventEmitter/eventEmitter'
import { IEventEmitterRegistryController } from '@ambire-common/interfaces/eventEmitter'
import {
  ExternalSignerController,
  QrAccountImportController
} from '@ambire-common/interfaces/keystore'
import { TypedMessageUserRequest } from '@ambire-common/interfaces/userRequest'

import { QrProtocolAdapter, QrRequest, QrSignaturePayload, QrSigningStep } from '../../qr/types'

/**
 * The QrHardwareController is responsible for managing QR-based hardware wallet interactions.
 * It acts as the bridge between Ambire's signing flow and QR-capable external signers by
 * creating signing sessions, exposing the active QR request, and resolving scanned responses.
 *
 * Its responsibilities include:
 * - handling the QR signing lifecycle (request → scan → response)
 * - delegating QR request generation and response parsing to the selected QR protocol adapter
 * - exposing account import functionality for QR-exported wallet data
 * - storing QR wallet metadata such as device model, device id, and master fingerprint
 *
 * Unlike Ledger/Trezor-style controllers, communication with the signer is not transport-based
 * (USB/HID/Web SDK), but happens through QR payload exchange coordinated by the UI layer.
 */
class QrHardwareController
  extends EventEmitter
  implements ExternalSignerController, QrAccountImportController
{
  type = 'qr'
  deviceModel = 'unknown'
  deviceId = ''
  masterFingerprint = ''

  protocolAdapter: QrProtocolAdapter

  currentRequest: QrRequest | null = null

  activeRequestId: string | null = null

  signingStep: QrSigningStep = 'idle'

  private resolveSession: ((payload: string | Uint8Array) => void) | null = null
  private rejectSession: ((error: Error) => void) | null = null

  constructor(
    protocolAdapter: QrProtocolAdapter,
    eventEmitterRegistry: IEventEmitterRegistryController
  ) {
    super(eventEmitterRegistry)
    this.protocolAdapter = protocolAdapter
  }

  isUnlocked = () => true
  unlock = async () => 'ALREADY_UNLOCKED' as const
  unlockedPath = ''
  unlockedPathKeyAddr = ''

  async requestSignature(request: QrRequest): Promise<string | Uint8Array> {
    if (this.currentRequest) {
      throw new ExternalSignerError('A QR signing session is already in progress.')
    }

    this.currentRequest = request
    this.activeRequestId = request.requestId || null
    this.signingStep = 'show-request'
    this.emitUpdate()

    return new Promise((resolve, reject) => {
      this.resolveSession = resolve
      this.rejectSession = reject
    })
  }

  moveToResponseScan() {
    if (!this.currentRequest) {
      throw new ExternalSignerError('No active QR signing session.')
    }

    this.signingStep = 'scan-response'
    this.emitUpdate()
  }

  private cancelSession(message = 'Operation cancelled by user') {
    if (this.rejectSession) {
      this.rejectSession(new ExternalSignerError(message))
    }

    this.resetSession()
    this.emitUpdate()
  }

  moveBack() {
    switch (this.signingStep) {
      case 'scan-response': {
        this.signingStep = 'show-request'
        this.emitUpdate()
        return
      }

      case 'show-request': {
        this.cancelSession()
        return
      }

      case 'idle':
      default: {
        throw new ExternalSignerError('No active QR signing session.')
      }
    }
  }

  submitSignatureResponse(payload: string | Uint8Array) {
    if (!this.currentRequest) {
      throw new ExternalSignerError('No active QR signing session.')
    }

    if (!this.resolveSession) {
      throw new ExternalSignerError('QR signing session was interrupted. Please restart signing.')
    }

    this.resolveSession(payload)
    this.resetSession()
    this.emitUpdate()
  }

  async signMessageQR(args: {
    hex: string
    derivationPath: string
    masterFingerprint: string
    address: string
  }): Promise<QrSignaturePayload> {
    const request = await this.protocolAdapter.buildSignMessageRequest({
      hex: args.hex,
      derivationPath: args.derivationPath,
      masterFingerprint: args.masterFingerprint,
      address: args.address
    })

    const response = await this.requestSignature(request)

    const signature = await this.protocolAdapter.parseSignatureResponse(response, request.requestId)

    return signature
  }

  async signTypedDataQR(args: {
    typedData: TypedMessageUserRequest['meta']['params']
    derivationPath: string
    masterFingerprint: string
    address: string
  }): Promise<QrSignaturePayload> {
    const request = await this.protocolAdapter.buildSignTypedDataRequest({
      typedData: args.typedData,
      derivationPath: args.derivationPath,
      masterFingerprint: args.masterFingerprint,
      address: args.address
    })

    const response = await this.requestSignature(request)

    return this.protocolAdapter.parseSignatureResponse(response, request.requestId)
  }

  async signTransactionQR(args: {
    txHex: string
    derivationPath: string
    masterFingerprint: string
    address: string
    chainId?: bigint
    type?: number
  }): Promise<QrSignaturePayload> {
    const request = await this.protocolAdapter.buildSignTransactionRequest({
      txHex: args.txHex,
      derivationPath: args.derivationPath,
      masterFingerprint: args.masterFingerprint,
      address: args.address,
      chainId: args.chainId,
      type: args.type
    })

    const response = await this.requestSignature(request)

    return this.protocolAdapter.parseSignatureResponse(response, request.requestId)
  }

  async signingCleanup() {
    this.cancelSession()
  }

  cleanUp = async () => {
    this.cancelSession('QR signing session was interrupted. Please restart signing.')
  }

  private resetSession() {
    this.currentRequest = null
    this.activeRequestId = null
    this.resolveSession = null
    this.rejectSession = null
    this.signingStep = 'idle'
  }

  async importAccountQR(payload: string | Uint8Array) {
    if (!this.protocolAdapter.parseAccountPayload) {
      throw new ExternalSignerError('QR protocol adapter does not support account import')
    }

    const parsedAccount = await this.protocolAdapter.parseAccountPayload(payload)
    this.deviceId = parsedAccount.deviceId || this.deviceId
    this.deviceModel = parsedAccount.deviceModel || this.deviceModel
    this.masterFingerprint = parsedAccount.masterFingerprint || this.masterFingerprint

    return parsedAccount
  }
}

export default QrHardwareController
