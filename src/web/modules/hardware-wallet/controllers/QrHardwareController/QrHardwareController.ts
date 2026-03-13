import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import {
  ExternalSignerController,
  QrAccountImportController
} from '@ambire-common/interfaces/keystore'
import { TypedMessageUserRequest } from '@ambire-common/interfaces/userRequest'

import { QrProtocolAdapter, QrRequest, QrSignaturePayload, QrSigningStep } from '../../qr/types'
import { importQrAccountsToReadyToAddKeys } from '../../qr/utils'

class QrHardwareController implements ExternalSignerController, QrAccountImportController {
  type = 'qr'
  // TODO: check if we can get more specific info from the QR payloads in the future to populate these fields better
  deviceModel = 'unknown'
  deviceId = ''

  protocolAdapter: QrProtocolAdapter

  currentRequest: QrRequest | null = null

  activeRequestId: string | null = null

  signingStep: QrSigningStep = 'idle'

  private resolveSession: ((payload: string | Uint8Array) => void) | null = null
  private rejectSession: ((error: Error) => void) | null = null

  constructor(protocolAdapter: QrProtocolAdapter) {
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
  }

  submitSignatureResponse(payload: string | Uint8Array) {
    if (!this.resolveSession) {
      throw new ExternalSignerError('No active QR signing session.')
    }

    this.resolveSession(payload)
    this.resetSession()
  }

  async signMessageQR(args: {
    hex: string
    derivationPath: string
    masterFingerprint: string
    address: string
  }): Promise<QrSignaturePayload> {
    console.log('4. QrHardwareController: signMessageQR called with args:', args) // Debug log
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

  async signingCleanup() {
    if (this.rejectSession) {
      this.rejectSession(new ExternalSignerError('Operation cancelled by user'))
    }

    this.resetSession()
  }

  cleanUp = () => {
    this.resetSession()
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

    return parsedAccount
  }
}

export default QrHardwareController
