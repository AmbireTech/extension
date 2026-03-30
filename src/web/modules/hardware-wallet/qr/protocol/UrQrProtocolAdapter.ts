import { hexlify } from 'ethers'
import { stringify as uuidStringify, v4 as uuidv4 } from 'uuid'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { TypedMessageUserRequest } from '@ambire-common/interfaces/userRequest'
import { stripHexPrefix } from '@ambire-common/utils/stripHexPrefix'
import { CryptoHDKey, DataType, ETHSignature, EthSignRequest } from '@keystonehq/bc-ur-registry-eth'

import { QrProtocolAdapter, QrRequest, QrSignaturePayload } from '../types'
import { isSignatureParts, normalizeOriginHdPath } from '../utils'
import { QrWalletType } from '../wallets'

/**
 * The UrQrProtocolAdapter is responsible for handling QR payloads that follow the UR protocol.
 * It converts Ambire signing and account import requests into UR-compatible payloads and parses
 * scanned UR responses back into usable data.
 *
 * Its responsibilities include:
 * - building UR requests for signing messages, typed data, and transactions
 * - encoding requests into CBOR/UR format for QR transmission
 * - parsing UR signature responses and normalizing them into standard signature formats
 * - validating request/response pairing via requestId
 * - parsing account export payloads (CryptoHDKey) to extract xpub, derivation path, and metadata
 *
 * This adapter encapsulates all UR-specific logic and dependencies, keeping higher-level
 * controllers and signers independent from protocol implementation details.
 *
 * It is protocol-focused (UR), not wallet-specific — allowing multiple QR wallets (e.g. Keystone,
 * imToken) to reuse the same adapter while applying their own derivation or behavioral constraints.
 */
class UrQrProtocolAdapter implements QrProtocolAdapter {
  protocol: 'ur' = 'ur'

  async buildSignMessageRequest(args: {
    hex: string
    derivationPath: string
    masterFingerprint: string
    address?: string
    chainId?: bigint
  }): Promise<QrRequest> {
    try {
      const strippedHex = stripHexPrefix(args.hex)

      if (!strippedHex) {
        throw new ExternalSignerError('Cannot create QR sign request for an empty message.')
      }

      const signData = Buffer.from(strippedHex, 'hex')
      const requestId = uuidv4()
      const masterFingerprint = stripHexPrefix(args.masterFingerprint)

      // The exact constructor signature can vary slightly by installed version.
      // In current Keystone ETH UR packages, EthSignRequest is the right type
      // for Ethereum signing payloads. Keep any version-specific adjustment
      // isolated in this adapter.
      const request = EthSignRequest.constructETHRequest(
        signData,
        DataType.personalMessage,
        args.derivationPath,
        masterFingerprint,
        requestId,
        args.chainId !== undefined ? Number(args.chainId) : undefined,
        undefined,
        args.address
      )

      const ur = request.toUR()

      return {
        type: 'sign-message',
        requestId,
        urType: ur.type,
        urCborHex: ur.cbor.toString('hex')
      }
    } catch (e: any) {
      throw new ExternalSignerError(e?.message || 'Failed to build UR sign-message request.', {
        sendCrashReport: true
      })
    }
  }

  async buildSignTypedDataRequest(args: {
    typedData: TypedMessageUserRequest['meta']['params']
    masterFingerprint: string
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
        args.masterFingerprint,
        requestId,
        undefined, // chainId
        args.address
      )

      const ur = request.toUR()

      return {
        type: 'sign-typed-data',
        requestId,
        urType: ur.type,
        urCborHex: ur.cbor.toString('hex')
      }
    } catch (e: any) {
      throw new ExternalSignerError(e?.message || 'Failed to build UR sign-typed-data request.', {
        sendCrashReport: true
      })
    }
  }

  async buildSignTransactionRequest(args: {
    txHex: string
    derivationPath: string
    masterFingerprint: string
    address?: string
    chainId?: bigint
  }): Promise<QrRequest> {
    try {
      const strippedHex = stripHexPrefix(args.txHex)

      if (!strippedHex) {
        throw new ExternalSignerError('Cannot create QR sign request for an empty transaction.')
      }

      const txData = Buffer.from(strippedHex, 'hex')
      const requestId = uuidv4()
      const masterFingerprint = stripHexPrefix(args.masterFingerprint)

      const request = EthSignRequest.constructETHRequest(
        // signData: Buffer,
        txData,
        // signDataType: DataType,
        DataType.typedTransaction,
        // hdPath: string,
        args.derivationPath,
        // xfp: string,
        masterFingerprint,
        // uuidString?: string
        requestId,
        // chainId?: number
        args.chainId !== undefined ? Number(args.chainId) : undefined,
        // address?: string,
        undefined,
        /// origin?: string
        args.address
      )

      const ur = request.toUR()

      return {
        type: 'sign-transaction',
        requestId,
        urType: ur.type,
        urCborHex: ur.cbor.toString('hex')
      }
    } catch (e: any) {
      throw new ExternalSignerError(e?.message || 'Failed to build UR sign-transaction request.', {
        sendCrashReport: true
      })
    }
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

        let normalizedResponseId: string | undefined

        if (responseId) {
          if (typeof responseId === 'string') {
            normalizedResponseId = responseId
          } else if (responseId instanceof Uint8Array || ArrayBuffer.isView(responseId)) {
            normalizedResponseId = uuidStringify(Uint8Array.from(responseId))
          }
        }

        if (normalizedResponseId && normalizedResponseId !== expectedRequestId) {
          throw new ExternalSignerError('QR signature response does not match the active request.')
        }
      }

      const signature: unknown = ethSignature.getSignature()

      if (typeof signature === 'string') {
        return { signature }
      }

      if (signature instanceof Uint8Array) {
        return {
          r: hexlify(signature.slice(0, 32)),
          s: hexlify(signature.slice(32, 64)),
          v: Number(hexlify(signature.slice(64)))
        }
      }

      if (ArrayBuffer.isView(signature)) {
        return {
          signature: hexlify(
            new Uint8Array(signature.buffer, signature.byteOffset, signature.byteLength)
          )
        }
      }

      if (isSignatureParts(signature)) {
        return {
          r: signature.r,
          s: signature.s,
          v: signature.v
        }
      }

      throw new ExternalSignerError('Unsupported QR signature format.')
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
      const originPath = origin?.getPath?.()
      const normalizedOriginPath = normalizeOriginHdPath(originPath)
      const xpub = hdKey.getBip32Key()
      if (!xpub) throw new Error('Missing BIP32 key in UR payload')
      const masterFingerprint =
        origin?.getSourceFingerprint?.()?.toString('hex') || parentFingerprintHex

      const deviceModel = hdKey.getName?.().split('-')[0]?.toLowerCase() || 'keystone' // Default to 'keystone' if the model cannot be determined
      const walletType = deviceModel.toLowerCase() as QrWalletType
      const deviceId = `${walletType}-${masterFingerprint || 'unknown'}`

      return {
        walletType,
        deviceModel,
        deviceId,
        masterFingerprint,
        hdPath: normalizedOriginPath,
        accounts: [
          {
            xpub,
            index: 0,
            hdPath: normalizedOriginPath
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
