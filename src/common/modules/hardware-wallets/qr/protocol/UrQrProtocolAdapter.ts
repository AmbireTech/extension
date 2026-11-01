import { computeAddress, hexlify } from 'ethers'
import { stringify as uuidStringify, v4 as uuidv4 } from 'uuid'

import ExternalSignerError from '@ambire-common/classes/ExternalSignerError'
import { TypedMessageUserRequest } from '@ambire-common/interfaces/userRequest'
import { stripHexPrefix } from '@ambire-common/utils/stripHexPrefix'
import {
  CryptoAccount,
  CryptoHDKey,
  DataType,
  decodeToDataItem,
  ETHSignature,
  EthSignRequest
} from '@keystonehq/bc-ur-registry-eth'

import {
  QrProtocolAdapter,
  QrSignaturePayload,
  QrSignRequest
} from '@common/modules/hardware-wallets/qr/types'
import {
  exceedsQrRequestSizeLimit,
  exceedsQrTypedDataDisplayLimits,
  isSignatureParts,
  normalizeOriginHdPath,
  toDecimalUintFields
} from '../utils'
import { ParsedQrAccount } from '@ambire-common/interfaces/keystore'

const DEFAULT_DEVICE_MODEL = 'QR Hardware'
const UNSUPPORTED_ACCOUNT_PAYLOAD_MSG =
  "This QR code doesn't contain accounts Ambire can import. Please scan the QR code your hardware wallet shows for connecting a software wallet."
const UNREADABLE_ACCOUNT_PAYLOAD_MSG =
  "Ambire couldn't read the accounts in this QR code. Please scan it again, and make sure it's the QR code your hardware wallet shows for connecting a software wallet."

/** Keys of the CBOR maps the account exports are encoded in, as the UR registry defines them. */
const CRYPTO_HDKEY_KEY_DATA_FIELD = 3
const CRYPTO_ACCOUNT_OUTPUT_DESCRIPTORS_FIELD = 2

/**
 * Which UR type an account export is: a single extended public key (`crypto-hdkey`, which
 * the standard and Ledger Legacy paths are exported as) or a list of separate accounts
 * (`crypto-account`, which Ledger Live is exported as). The scanner hands over the CBOR
 * payload without its type, so it is told by the fields each type requires.
 */
function getAccountPayloadType(cbor: Buffer): 'crypto-hdkey' | 'crypto-account' | null {
  // Both exports are CBOR maps, but a scan can hold any other CBOR value too
  const fields: Record<number, unknown> | null = decodeToDataItem(cbor).getData()
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return null

  if (Buffer.isBuffer(fields[CRYPTO_HDKEY_KEY_DATA_FIELD])) return 'crypto-hdkey'
  if (Array.isArray(fields[CRYPTO_ACCOUNT_OUTPUT_DESCRIPTORS_FIELD])) return 'crypto-account'

  return null
}

function normalizeTypedDataForQr(
  typedData: TypedMessageUserRequest['meta']['params']
): TypedMessageUserRequest['meta']['params'] {
  const normalizedTypes: Record<string, Array<{ name: string; type: string }>> = {}

  for (const [typeName, fields] of Object.entries((typedData as any)?.types || {})) {
    if (!Array.isArray(fields)) continue
    normalizedTypes[typeName] = fields
      .map((field: any) => ({
        name: String(field?.name ?? ''),
        type: String(field?.type ?? '')
      }))
      .filter((field) => field.name.length > 0 && field.type.length > 0)
  }

  // Keycard Shell is strict about EIP-712 typed data format. In practice we’ve seen issues
  // when `domain.chainId` is not a plain JSON number (e.g. bigint/hex string).
  const domain: any = { ...(typedData.domain || {}) }
  const rawChainId = domain.chainId

  if (typeof rawChainId === 'bigint') {
    domain.chainId = Number(rawChainId)
  } else if (typeof rawChainId === 'string') {
    // accept both decimal and hex (0x...)
    const parsed = rawChainId.startsWith('0x')
      ? Number.parseInt(rawChainId, 16)
      : Number(rawChainId)
    if (Number.isFinite(parsed)) domain.chainId = parsed
  }

  const primaryType = String((typedData as any).primaryType)

  // Keycard parser expects exactly these top-level keys for EIP-712 payloads.
  return {
    types: normalizedTypes,
    primaryType,
    domain,
    // Keystone 3 rejects Safe transactions whose numbers are written as hex strings
    message: toDecimalUintFields(
      primaryType,
      { ...((typedData as any).message || {}) },
      normalizedTypes
    )
  }
}

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
  }): Promise<QrSignRequest> {
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
        args.address,
        'ambire'
      )

      const ur = request.toUR()

      return {
        type: 'sign-message',
        requestId,
        urType: ur.type,
        urCborHex: ur.cbor.toString('hex'),
        isTooLargeForDevice: exceedsQrRequestSizeLimit(ur.cbor.length)
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
  }): Promise<QrSignRequest> {
    try {
      const normalizedTypedData = normalizeTypedDataForQr(args.typedData)
      const typedDataJson = JSON.stringify(normalizedTypedData)

      if (!typedDataJson) {
        throw new ExternalSignerError('Cannot create QR sign request for empty typed data.')
      }

      const signData = Buffer.from(typedDataJson, 'utf-8')
      const requestId = uuidv4()
      const masterFingerprint = stripHexPrefix(args.masterFingerprint)
      const rawChainId: any = (normalizedTypedData as any)?.domain?.chainId
      const chainId =
        typeof rawChainId === 'number' && Number.isFinite(rawChainId) ? rawChainId : undefined

      const request = EthSignRequest.constructETHRequest(
        signData,
        DataType.typedData,
        args.derivationPath,
        masterFingerprint,
        requestId,
        chainId,
        args.address,
        'ambire'
      )

      const ur = request.toUR()

      return {
        type: 'sign-typed-data',
        requestId,
        urType: ur.type,
        urCborHex: ur.cbor.toString('hex'),
        isTooLargeForDevice:
          exceedsQrRequestSizeLimit(ur.cbor.length) ||
          exceedsQrTypedDataDisplayLimits(normalizedTypedData.message)
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
    type?: number
  }): Promise<QrSignRequest> {
    try {
      const strippedHex = stripHexPrefix(args.txHex)

      if (!strippedHex) {
        throw new ExternalSignerError('Cannot create QR sign request for an empty transaction.')
      }

      const txData = Buffer.from(strippedHex, 'hex')
      const requestId = uuidv4()
      const masterFingerprint = stripHexPrefix(args.masterFingerprint)

      const request = EthSignRequest.constructETHRequest(
        txData,
        args?.type === 0 ? DataType.transaction : DataType.typedTransaction,
        args.derivationPath,
        masterFingerprint,
        requestId,
        args.chainId !== undefined ? Number(args.chainId) : undefined,
        args.address,
        'ambire'
      )

      const ur = request.toUR()

      return {
        type: 'sign-transaction',
        requestId,
        urType: ur.type,
        urCborHex: ur.cbor.toString('hex'),
        isTooLargeForDevice: exceedsQrRequestSizeLimit(ur.cbor.length)
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

  async parseAccountPayload(payload: string | Uint8Array): Promise<ParsedQrAccount> {
    try {
      const cbor =
        typeof payload === 'string'
          ? Buffer.from(stripHexPrefix(payload), 'hex')
          : Buffer.from(payload)

      const payloadType = getAccountPayloadType(cbor)

      if (payloadType === 'crypto-account') return this.#parseCryptoAccountPayload(cbor)
      if (payloadType === 'crypto-hdkey') return this.#parseCryptoHdKeyPayload(cbor)

      throw new ExternalSignerError(UNSUPPORTED_ACCOUNT_PAYLOAD_MSG)
    } catch (e: any) {
      if (e instanceof ExternalSignerError) throw e

      const error = new ExternalSignerError(UNREADABLE_ACCOUNT_PAYLOAD_MSG, {
        sendCrashReport: true
      })
      // Keeps the reason the scan could not be read for the crash report
      error.cause = e
      throw error
    }
  }

  /**
   * An export of separate accounts, each with its own public key. Wallets export these for
   * the paths a single extended public key cannot derive, like Ledger Live, whose account
   * index is hardened. Their addresses are taken from the keys as they are.
   */
  #parseCryptoAccountPayload(cbor: Buffer): ParsedQrAccount {
    const cryptoAccount = CryptoAccount.fromCBOR(cbor)
    const hdKeys = cryptoAccount
      .getOutputDescriptors()
      .flatMap((outputDescriptor) => outputDescriptor.getHDKey() ?? [])

    if (!hdKeys.length) {
      throw new ExternalSignerError('No accounts were found in the scanned QR code.')
    }

    const masterFingerprint = cryptoAccount.getMasterFingerprint().toString('hex')

    return {
      deviceModel: hdKeys[0]?.getName() || DEFAULT_DEVICE_MODEL,
      deviceId: masterFingerprint,
      masterFingerprint,
      accounts: hdKeys.map((hdKey) => ({
        addr: computeAddress(hexlify(hdKey.getKey())),
        hdPath: normalizeOriginHdPath(hdKey.getOrigin()?.getPath())
      }))
    }
  }

  /** An export of one extended public key, which all the addresses get derived from. */
  #parseCryptoHdKeyPayload(cbor: Buffer): ParsedQrAccount {
    const hdKey = CryptoHDKey.fromCBOR(cbor)
    // Optional in the export - the source fingerprint below is what gets used when present
    const parentFingerprintHex = hdKey.getParentFingerprint()?.toString('hex')
    const origin = hdKey.getOrigin()
    const originPath = origin?.getPath?.()
    const normalizedOriginPath = normalizeOriginHdPath(originPath)
    const xpub = hdKey.getBip32Key()
    if (!xpub) throw new Error('Missing BIP32 key in UR payload')
    const masterFingerprint =
      origin?.getSourceFingerprint?.()?.toString('hex') || parentFingerprintHex

    const deviceModel = hdKey.getName?.() || DEFAULT_DEVICE_MODEL
    const deviceId = `${masterFingerprint || 'unknown'}`
    // Says where the wallet puts its addresses below the exported key, which is the
    // only thing telling a standard export apart from a Ledger Legacy one when both
    // are exported from the same account-level path.
    const childrenPath = hdKey.getChildren?.()?.getPath?.()

    return {
      deviceModel,
      deviceId,
      masterFingerprint,
      hdPath: normalizedOriginPath,
      childrenPath,
      accounts: [
        {
          xpub,
          index: 0,
          hdPath: normalizedOriginPath
        }
      ]
    }
  }
}

export default UrQrProtocolAdapter
