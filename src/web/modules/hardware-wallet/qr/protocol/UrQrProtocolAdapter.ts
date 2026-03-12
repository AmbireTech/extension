import { parse as uuidParse, v4 as uuidv4 } from 'uuid'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { TypedMessageUserRequest } from '@ambire-common/interfaces/userRequest'
import { stripHexPrefix } from '@ambire-common/utils/stripHexPrefix'
import { CryptoHDKey, DataType, ETHSignature, EthSignRequest } from '@keystonehq/bc-ur-registry-eth'
import { UREncoder } from '@ngraveio/bc-ur'

import { QrProtocolAdapter, QrRequest, QrSignaturePayload } from '../types'

const MAX_QR_FRAGMENT_LENGTH = 200

class UrQrProtocolAdapter implements QrProtocolAdapter {
  protocol: 'ur' = 'ur'

  private encodeUrToFrames(ur: any): string[] {
    const encoder = new UREncoder(ur, MAX_QR_FRAGMENT_LENGTH)
    const frames: string[] = []

    // Some encoder impls expose isComplete(); some flows are effectively
    // “collect until the first full cycle is generated”.
    do {
      frames.push(encoder.nextPart())
    } while (!encoder.isComplete())

    return frames
  }

  async buildSignMessageRequest(args: {
    hex: string
    derivationPath: string
    address?: string
    chainId?: bigint
  }): Promise<QrRequest> {
    try {
      const strippedHex = stripHexPrefix(args.hex)

      if (!strippedHex) {
        throw new ExternalSignerError('Cannot create QR sign request for an empty message.')
      }

      const signData = Buffer.from(strippedHex, 'hex')

      // The exact constructor signature can vary slightly by installed version.
      // In current Keystone ETH UR packages, EthSignRequest is the right type
      // for Ethereum signing payloads. Keep any version-specific adjustment
      // isolated in this adapter.
      const request = EthSignRequest.constructETHRequest(
        signData,
        DataType.personalMessage,
        args.derivationPath,
        args.chainId !== undefined ? Number(args.chainId) : undefined,
        undefined,
        args.address
      )

      const ur = request.toUR()
      const frames = this.encodeUrToFrames(ur)

      return {
        type: 'sign-message',
        frames
      }
    } catch (e: any) {
      throw new ExternalSignerError(e?.message || 'Failed to build UR sign-message request.', {
        sendCrashReport: true
      })
    }
  }

  async buildSignTypedDataRequest(args: {
    typedData: TypedMessageUserRequest['meta']['params']
    derivationPath: string
    address?: string
  }): Promise<QrRequest> {
    try {
      const typedDataJson = JSON.stringify(args.typedData)

      if (!typedDataJson) {
        throw new ExternalSignerError('Cannot create QR sign request for empty typed data.')
      }

      const signData = Buffer.from(typedDataJson, 'utf-8')
      const requestId = uuidv4()

      const request = EthSignRequest.constructETHRequest(
        signData,
        DataType.typedData,
        args.derivationPath,
        // undefined, // xfp for now
        '', // xfp for now
        // uuidParse(requestId),
        requestId,
        undefined, // chainId
        args.address
      )

      const ur = request.toUR()
      const frames = this.encodeUrToFrames(ur)

      return {
        type: 'sign-typed-data',
        frames,
        requestId
      }
    } catch (e: any) {
      throw new ExternalSignerError(e?.message || 'Failed to build UR sign-typed-data request.', {
        sendCrashReport: true
      })
    }
  }

  async buildSignTransactionRequest(): Promise<QrRequest> {
    throw new Error('Not implemented yet')
  }

  async parseSignatureResponse(
    payload: string | Uint8Array,
    expectedRequestId?: string
  ): Promise<QrSignaturePayload> {
    try {
      const cbor =
        typeof payload === 'string'
          ? Buffer.from(stripHexPrefix(payload), 'hex')
          : Buffer.from(payload)

      const ethSignature = ETHSignature.fromCBOR(cbor)

      if (expectedRequestId) {
        const responseId = ethSignature.getRequestId?.()

        if (responseId && responseId.toString() !== expectedRequestId) {
          throw new ExternalSignerError('QR signature response does not match the active request.')
        }
      }

      const signature = ethSignature.getSignature()

      if (typeof signature === 'string') {
        return { signature }
      }

      return {
        r: signature.r,
        s: signature.s,
        v: signature.v
      }
    } catch (e: any) {
      throw new ExternalSignerError(e?.message || 'Failed to parse UR signature response.', {
        sendCrashReport: true
      })
    }
  }

  async parseAccountPayload(payload: string | Uint8Array) {
    try {
      const cbor =
        typeof payload === 'string'
          ? Buffer.from(stripHexPrefix(payload), 'hex')
          : Buffer.from(payload)

      const hdKey = CryptoHDKey.fromCBOR(cbor)
      const parentFingerprintHex = hdKey.getParentFingerprint().toString('hex')
      const origin = hdKey.getOrigin()
      const xpub = hdKey.getBip32Key()
      if (!xpub) throw new Error('Missing BIP32 key in UR payload')
      const masterFingerprint =
        origin?.getSourceFingerprint?.()?.toString('hex') || parentFingerprintHex

      return {
        masterFingerprint,
        accounts: [
          {
            xpub,
            index: 0
          }
        ]
      }
    } catch (e: any) {
      throw new ExternalSignerError(e?.message || 'Failed to parse UR account payload', {
        sendCrashReport: true
      })
    }
  }
}

export default UrQrProtocolAdapter
