import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import {
  ExternalSignerController,
  QrAccountImportController
} from '@ambire-common/interfaces/keystore'
import { TypedMessageUserRequest } from '@ambire-common/interfaces/userRequest'

import { QrProtocolAdapter, QrRequest, QrSignaturePayload } from '../../qr/types'

class QrHardwareController implements ExternalSignerController, QrAccountImportController {
  type = 'qr'
  deviceModel = 'unknown'
  deviceId = ''

  protocolAdapter: QrProtocolAdapter

  currentRequest: QrRequest | null = null

  activeRequestId: string | null = null

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

    return new Promise((resolve, reject) => {
      this.resolveSession = resolve
      this.rejectSession = reject
    })
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
    address: string
  }): Promise<QrSignaturePayload> {
    const request = await this.protocolAdapter.buildSignMessageRequest({
      hex: args.hex,
      derivationPath: args.derivationPath,
      address: args.address
    })

    const response = await this.requestSignature(request)

    const signature = await this.protocolAdapter.parseSignatureResponse(response, request.requestId)

    return signature
  }

  async signTypedDataQR(args: {
    typedData: TypedMessageUserRequest['meta']['params']
    derivationPath: string
    address: string
  }): Promise<QrSignaturePayload> {
    const request = await this.protocolAdapter.buildSignTypedDataRequest({
      typedData: args.typedData,
      derivationPath: args.derivationPath,
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
  }

  async importAccountQR(payload: string | Uint8Array) {
    if (!this.protocolAdapter.parseAccountPayload) {
      throw new ExternalSignerError('QR protocol adapter does not support account import')
    }

    return this.protocolAdapter.parseAccountPayload(payload)
  }
}

export default QrHardwareController
