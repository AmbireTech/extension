import { ParsedQrAccount, QrRequest } from '@ambire-common/interfaces/keystore'
import { TypedMessageUserRequest } from '@ambire-common/interfaces/userRequest'

export type QrSigningStep = 'idle' | 'show-request' | 'scan-response'

export type ActiveQrSigningSession = {
  type: 'sign-message' | 'sign-typed-data' | 'sign-transaction'
  request: QrRequest
  step: QrSigningStep
  expectedRequestId?: string
}

export type QrSignaturePayload = { signature: string } | { r: string; s: string; v: number }

export type SignatureParts = {
  r: string
  s: string
  v: number
}

export interface QrProtocolAdapter {
  protocol: 'ur' | 'airgap'

  buildSignMessageRequest(args: {
    hex: string
    derivationPath: string
    masterFingerprint: string
    address?: string
    chainId?: bigint
  }): Promise<QrRequest>

  buildSignTypedDataRequest(args: {
    typedData: TypedMessageUserRequest['meta']['params']
    derivationPath: string
    masterFingerprint: string
    address?: string
  }): Promise<QrRequest>

  buildSignTransactionRequest(args: {
    txHex: string
    derivationPath: string
    masterFingerprint: string
    address?: string
    chainId?: bigint
    type?: number
  }): Promise<QrRequest>

  parseSignatureResponse(
    payload: string | Uint8Array,
    expectedRequestId?: string
  ): Promise<QrSignaturePayload>

  parseAccountPayload(payload: string | Uint8Array): Promise<ParsedQrAccount>
}
