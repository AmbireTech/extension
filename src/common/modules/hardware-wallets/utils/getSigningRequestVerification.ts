import { concat, isHexString, keccak256, Transaction, ZeroAddress } from 'ethers'

import { TxnRequest } from '@ambire-common/interfaces/keystore'
import { HardwareWalletSigningRequest } from '@ambire-common/interfaces/signAccountOp'
import { SAFE_CALL_OPERATION, SAFE_DELEGATE_CALL_OPERATION } from '@ambire-common/libs/safe/helpers'
import { captureException } from '@common/config/analytics/CrashAnalytics'

import { ERC_8213_LABELS, getCalldataDigest, getEip712Digest, getErc191Digest } from './erc8213'
import { getRequestCalls, RequestCalls } from './getRequestCalls'
import { getUnsignedTransaction } from './getUnsignedTransaction'
import { isRecord, isSafeTxTypedData, toBigIntOrNull } from './signingRequestData'

/** A hash the user can rebuild from the request and compare with their device */
export type VerificationHash = {
  id: string
  label: string
  value: string
  note?: string
}

/**
 * A check that anyone can confirm by reading the request, so it doesn't rely
 * on trusting Ambire's interpretation of it
 */
export type SafeTransactionCheck = {
  id: string
  label: string
  isPassing: boolean
}

export type SigningRequestVerification = {
  requestKind: 'typed-data' | 'transaction' | 'other'
  hashes: VerificationHash[]
  /**
   * The digests ERC-8213 standardizes, under its names, so they can be compared
   * with any wallet or hardware wallet that follows it
   */
  erc8213Digests: VerificationHash[]
  /** Explains why a hash the user expects is missing */
  missingHashReason: string | null
  /** Whether keccak256(0x1901 ‖ domain hash ‖ message hash) gives the Safe hash */
  safeHashFormula: { isMatch: boolean } | null
  safeTransactionChecks: SafeTransactionCheck[]
  /** The request as sent to the device, in the standard shape hashing tools accept */
  requestJson: string
  /** The calls the request makes, read once for both the checks and the decoded data */
  requestCalls: RequestCalls | null
}

/** Everything but the calls, which are read once for the whole request */
type RequestVerification = Omit<SigningRequestVerification, 'requestCalls'>

type Options = {
  /**
   * The device signs a transaction that also upgrades the account (type 4),
   * so the request alone isn't everything that's signed
   */
  isAccountUpgradeTransaction?: boolean
}

/** The fields of a transaction request, the same ones the hardware wallet signers serialize */
const TRANSACTION_KEYS = [
  'to',
  'value',
  'data',
  'chainId',
  'nonce',
  'gasLimit',
  'gasPrice',
  'maxFeePerGas',
  'maxPriorityFeePerGas',
  'type'
]

const TYPED_DATA_KEYS = ['domain', 'types', 'primaryType', 'message']

const isHash = (value: unknown): value is string => isHexString(value, 32)

const toOptionalBigInt = (value: unknown): bigint | undefined => toBigIntOrNull(value) ?? undefined

/**
 * Reads the transaction request back from the request as it was serialized
 * for the UI, so it can be built into a transaction like the signers do it
 */
const toTxnRequest = (data: Record<string, unknown>): TxnRequest | null => {
  const chainId = toBigIntOrNull(data.chainId)
  const nonce = toBigIntOrNull(data.nonce)
  const gasLimit = toBigIntOrNull(data.gasLimit)
  if (chainId === null || nonce === null || gasLimit === null) return null
  if (typeof data.data !== 'string') return null
  if (data.to !== undefined && data.to !== null && typeof data.to !== 'string') return null

  return {
    to: typeof data.to === 'string' ? data.to : undefined,
    value: toOptionalBigInt(data.value),
    data: data.data,
    chainId,
    nonce: Number(nonce),
    gasLimit,
    gasPrice: toOptionalBigInt(data.gasPrice),
    maxFeePerGas: toOptionalBigInt(data.maxFeePerGas),
    maxPriorityFeePerGas: toOptionalBigInt(data.maxPriorityFeePerGas)
  }
}

const stringify = (data: unknown): string => {
  try {
    // The request is already serialized for the UI, so it has no bigints left
    return JSON.stringify(data, null, 2) || String(data)
  } catch {
    return String(data)
  }
}

const pickKeys = (record: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(keys.filter((key) => key in record).map((key) => [key, record[key]]))

/** The hash of the unsigned transaction, which is what the device signs */
const getUnsignedTransactionHash = (data: Record<string, unknown>): string | null => {
  // Anything else in the request means it's not a plain transaction, so
  // a hash built from it may not be what the device signs
  if (Object.keys(data).some((key) => !TRANSACTION_KEYS.includes(key))) return null

  const txnRequest = toTxnRequest(data)
  if (!txnRequest) return null

  try {
    // Built with the same helper the hardware wallet signers use, so the hash
    // can't drift from what the device signs
    return Transaction.from(getUnsignedTransaction(txnRequest)).unsignedHash
  } catch (error) {
    // The request has the shape of a transaction, so failing to serialize it is unexpected
    console.error('hardware wallet signing: could not serialize the transaction', error)
    captureException(error)
    return null
  }
}

const getTransactionVerification = (
  data: unknown,
  { isAccountUpgradeTransaction }: Options
): RequestVerification => {
  const base: RequestVerification = {
    requestKind: 'transaction',
    hashes: [],
    erc8213Digests: [],
    missingHashReason: null,
    safeHashFormula: null,
    safeTransactionChecks: [],
    requestJson: stringify(data)
  }
  if (!isRecord(data)) return base

  if (Array.isArray(data.calls)) {
    return {
      ...base,
      missingHashReason:
        "There's no transaction hash to compare, as your device builds the transaction from these calls on its own."
    }
  }

  // The calldata is signed as is, whatever else the transaction carries, so
  // its digest is shown even when the transaction hash can't be
  const calldataDigest = getCalldataDigest(data.data)
  const transactionBase: RequestVerification = {
    ...base,
    erc8213Digests: calldataDigest
      ? [
          {
            id: 'calldataDigest',
            label: ERC_8213_LABELS.calldataDigest,
            value: calldataDigest,
            note: "ERC-8213: keccak256(data length as uint256 ‖ data). It doesn't cover the recipient (to) or the amount (value), so check them separately."
          }
        ]
      : []
  }

  if (isAccountUpgradeTransaction) {
    return {
      ...transactionBase,
      missingHashReason:
        "The transaction hash isn't shown because this transaction also upgrades your account, which is signed together with it."
    }
  }

  const transactionHash = getUnsignedTransactionHash(data)
  if (!transactionHash) {
    return {
      ...transactionBase,
      missingHashReason: "The transaction hash couldn't be calculated for this request."
    }
  }

  return {
    ...transactionBase,
    hashes: [
      {
        id: 'transactionHash',
        label: 'Transaction hash',
        value: transactionHash,
        note: 'keccak256 of the unsigned transaction serialized from the fields above.'
      }
    ]
  }
}

const isEmptyAddress = (value: unknown) =>
  value === undefined || (typeof value === 'string' && value.toLowerCase() === ZeroAddress)

/** The checks of the batch a Safe transaction runs. A readable batch without delegate calls adds nothing */
const getSafeBatchChecks = (
  safeCalls: Extract<RequestCalls, { kind: 'safe-transaction' }>
): SafeTransactionCheck[] => {
  const checks: SafeTransactionCheck[] = []

  // The batch contract passing doesn't cover what the batch runs, so a
  // delegate call inside it is flagged on its own
  if (safeCalls.calls.some(({ operation }) => operation === SAFE_DELEGATE_CALL_OPERATION)) {
    checks.push({
      id: 'batch-operation',
      label:
        'operation 1 inside the batch: a transaction in it is a delegate call. It gets full control of the Safe.',
      isPassing: false
    })
  }
  // A delegate call could hide in the part that couldn't be read
  if (safeCalls.batchError) {
    checks.push({
      id: 'batch-unreadable',
      label: "Part of the batch couldn't be read, so it can't be checked for delegate calls.",
      isPassing: false
    })
  }

  return checks
}

const getSafeTransactionChecks = (
  message: Record<string, unknown>,
  requestCalls: RequestCalls | null
): SafeTransactionCheck[] => {
  const checks: SafeTransactionCheck[] = []
  const operation = toBigIntOrNull(message.operation)
  // The same batch the decoded data lists: a delegate call to Safe's batch
  // contract that calls its multiSend function
  const safeBatchCalls =
    requestCalls?.kind === 'safe-transaction' && requestCalls.isBatch ? requestCalls : null

  if (operation === BigInt(SAFE_CALL_OPERATION)) {
    checks.push({ id: 'operation', label: 'operation 0: a normal call', isPassing: true })
  } else if (operation === BigInt(SAFE_DELEGATE_CALL_OPERATION) && safeBatchCalls) {
    checks.push({
      id: 'operation',
      label: "operation 1: a delegate call to Safe's batch contract, which is normal for batches",
      isPassing: true
    })
  } else if (operation === BigInt(SAFE_DELEGATE_CALL_OPERATION)) {
    checks.push({
      id: 'operation',
      label:
        "operation 1: a delegate call that isn't a Safe batch. The contract it calls gets full control of the Safe.",
      isPassing: false
    })
  } else {
    checks.push({ id: 'operation', label: 'operation has an unknown value', isPassing: false })
  }

  if (safeBatchCalls) checks.push(...getSafeBatchChecks(safeBatchCalls))

  const hasGasRefund =
    (toBigIntOrNull(message.gasPrice) ?? 0n) !== 0n ||
    !isEmptyAddress(message.gasToken) ||
    !isEmptyAddress(message.refundReceiver)

  checks.push(
    hasGasRefund
      ? {
          id: 'gas-refund',
          label: 'A gas refund is set. The Safe can pay gasToken to refundReceiver when this runs.',
          isPassing: false
        }
      : {
          id: 'gas-refund',
          label: 'No gas refund: gasPrice, gasToken and refundReceiver are empty',
          isPassing: true
        }
  )

  return checks
}

/**
 * The EIP-712 Digest, which is the hash the device signs, and for a Safe
 * transaction also the Calldata Digest of the data the Safe runs. The Safe
 * hash is the EIP-712 Digest under Safe's name, so the digest is left out
 * when it matches the Safe hash shown, and kept only when they differ, as
 * it's then the hash the device actually signs
 */
const getTypedDataErc8213Digests = (
  data: Record<string, unknown>,
  safeTxHash: string | null
): VerificationHash[] => {
  const digests: VerificationHash[] = []
  const eip712Digest = getEip712Digest(data.domainHash, data.messageHash)
  const safeHash = safeTxHash ?? (isHash(data.safeMessageHash) ? data.safeMessageHash : null)
  const isSameAsSafeHash =
    !!eip712Digest && !!safeHash && safeHash.toLowerCase() === eip712Digest.toLowerCase()

  if (eip712Digest && !isSameAsSafeHash) {
    digests.push({
      id: 'eip712Digest',
      label: ERC_8213_LABELS.eip712Digest,
      value: eip712Digest,
      note: 'ERC-8213: keccak256(0x1901 ‖ Domain hash ‖ Message hash), the hash your device signs.'
    })
  }

  const safeCalldataDigest = isSafeTxTypedData(data) ? getCalldataDigest(data.message.data) : null
  if (safeCalldataDigest) {
    digests.push({
      id: 'safeCalldataDigest',
      label: ERC_8213_LABELS.calldataDigest,
      value: safeCalldataDigest,
      note: "ERC-8213 digest of the data the Safe runs: keccak256(data length as uint256 ‖ data). It doesn't cover the recipient (to) or the amount (value), so check them separately."
    })
  }

  return digests
}

const getTypedDataVerification = (
  data: unknown,
  requestCalls: RequestCalls | null
): RequestVerification => {
  const base: RequestVerification = {
    requestKind: 'typed-data',
    hashes: [],
    erc8213Digests: [],
    missingHashReason: null,
    safeHashFormula: null,
    safeTransactionChecks: [],
    requestJson: stringify(data)
  }
  if (!isRecord(data)) return base

  const { domainHash, messageHash, safeTxHash, safeMessageHash } = data
  const isSafeTransaction = isSafeTxTypedData(data)
  const sentSafeTxHash = isHash(safeTxHash) ? safeTxHash : null
  // A Safe transaction from a dapp comes without the Safe hash, so it's
  // calculated from the domain and message hashes, the same way Safe does it
  const calculatedSafeTxHash =
    !sentSafeTxHash && isSafeTransaction && isHash(domainHash) && isHash(messageHash)
      ? keccak256(concat(['0x1901', domainHash, messageHash]))
      : null
  const safeMessageHashValue = isHash(safeMessageHash) ? safeMessageHash : null
  // Only a Safe hash sent with the request is checked against the formula, as
  // checking the calculated one would only repeat the calculation
  const sentSafeHashValue = sentSafeTxHash ?? safeMessageHashValue
  const hashes: VerificationHash[] = []

  if (sentSafeTxHash) {
    hashes.push({ id: 'safeTxHash', label: 'Safe transaction hash', value: sentSafeTxHash })
  }
  if (calculatedSafeTxHash) {
    hashes.push({
      id: 'safeTxHash',
      label: 'Safe transaction hash',
      value: calculatedSafeTxHash,
      note: 'keccak256(0x1901 ‖ Domain hash ‖ Message hash), calculated by Ambire. Compare it with the one in the Safe app.'
    })
  }
  if (safeMessageHashValue) {
    hashes.push({
      id: 'safeMessageHash',
      label: 'Safe message hash',
      value: safeMessageHashValue
    })
  }
  if (isHash(domainHash)) hashes.push({ id: 'domainHash', label: 'Domain hash', value: domainHash })
  if (isHash(messageHash)) {
    hashes.push({ id: 'messageHash', label: 'Message hash', value: messageHash })
  }

  const safeHashFormula =
    sentSafeHashValue && isHash(domainHash) && isHash(messageHash)
      ? {
          isMatch:
            keccak256(concat(['0x1901', domainHash, messageHash])).toLowerCase() ===
            sentSafeHashValue.toLowerCase()
        }
      : null

  return {
    ...base,
    hashes,
    erc8213Digests: getTypedDataErc8213Digests(data, sentSafeTxHash ?? calculatedSafeTxHash),
    safeHashFormula,
    safeTransactionChecks: isSafeTransaction
      ? getSafeTransactionChecks(data.message, requestCalls)
      : [],
    // Only the typed data itself, so it can be pasted into a hashing tool as is
    requestJson: stringify(pickKeys(data, TYPED_DATA_KEYS))
  }
}

/** The ERC-191 Digest of a message, which is the hash the device signs for it */
const getMessageErc8213Digests = (data: unknown): VerificationHash[] => {
  let erc191Digest: string | null = null
  try {
    erc191Digest = isRecord(data) ? getErc191Digest(data.message) : null
  } catch (error) {
    // Messages reach the device as hex, so only text that can't be encoded
    // (e.g. a broken emoji) gets here. Kept from breaking the signing screen
    console.error('hardware wallet signing: could not calculate the ERC-191 Digest', error)
    captureException(error)
  }
  if (!erc191Digest) return []

  return [
    {
      id: 'erc191Digest',
      label: ERC_8213_LABELS.erc191Digest,
      value: erc191Digest,
      note: 'ERC-8213: keccak256("\\x19Ethereum Signed Message:\\n" ‖ message length ‖ message), the hash your device signs.'
    }
  ]
}

/**
 * Prepares what a user needs to verify a hardware wallet signing request on
 * their own: the request exactly as sent (ready to paste into a hashing
 * tool), the hashes Ambire computed from it, the ERC-8213 digests (Calldata,
 * EIP-712 or ERC-191 Digest), for Safe transactions, the
 * checks that can be confirmed by reading the request, and the calls it makes.
 */
export const getSigningRequestVerification = (
  signingRequest: HardwareWalletSigningRequest,
  options: Options = {}
): SigningRequestVerification => {
  const requestCalls = getRequestCalls(signingRequest)

  if (signingRequest.type === 'raw-transaction') {
    return { ...getTransactionVerification(signingRequest.data, options), requestCalls }
  }
  if (signingRequest.type === 'eip-712') {
    return { ...getTypedDataVerification(signingRequest.data, requestCalls), requestCalls }
  }

  return {
    requestKind: 'other',
    hashes: [],
    erc8213Digests:
      signingRequest.type === 'message' ? getMessageErc8213Digests(signingRequest.data) : [],
    missingHashReason: null,
    safeHashFormula: null,
    safeTransactionChecks: [],
    requestJson: stringify(signingRequest.data),
    requestCalls
  }
}
