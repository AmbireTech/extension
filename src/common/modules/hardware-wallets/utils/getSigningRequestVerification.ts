import { concat, isHexString, keccak256, Transaction, ZeroAddress } from 'ethers'

import { allowedMulticallContracts } from '@ambire-common/consts/safe'
import { HardwareWalletSigningRequest } from '@ambire-common/interfaces/signAccountOp'
import { SAFE_CALL_OPERATION, SAFE_DELEGATE_CALL_OPERATION } from '@ambire-common/libs/safe/helpers'
import { captureException } from '@common/config/analytics/CrashAnalytics'

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
  /** Explains why a hash the user expects is missing */
  missingHashReason: string | null
  /** Whether keccak256(0x1901 ‖ domain hash ‖ message hash) gives the Safe hash */
  safeHashFormula: { isMatch: boolean } | null
  safeTransactionChecks: SafeTransactionCheck[]
  /** The request as sent to the device, in the standard shape hashing tools accept */
  requestJson: string
}

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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)

const isHash = (value: unknown): value is string => isHexString(value, 32)

const toBigIntOrNull = (value: unknown): bigint | null => {
  if (typeof value === 'bigint') return value
  if (typeof value !== 'string' && typeof value !== 'number') return null
  if (value === '') return null

  try {
    return BigInt(value)
  } catch {
    return null
  }
}

const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'bigint') return value.toString()

  return undefined
}

const stringify = (data: unknown): string => {
  try {
    return (
      JSON.stringify(
        data,
        (_, value) => (typeof value === 'bigint' ? value.toString() : value),
        2
      ) || String(data)
    )
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

  const nonce = toBigIntOrNull(data.nonce)
  if (nonce === null) return null

  try {
    // Built the same way the hardware wallet signers do it: a max fee per gas
    // means an EIP-1559 transaction, otherwise it's a legacy one
    const transaction = Transaction.from({
      type: data.maxFeePerGas !== undefined && data.maxFeePerGas !== null ? 2 : 0,
      to: toOptionalString(data.to),
      value: toOptionalString(data.value),
      data: toOptionalString(data.data),
      chainId: toOptionalString(data.chainId),
      nonce: Number(nonce),
      gasLimit: toOptionalString(data.gasLimit),
      gasPrice: toOptionalString(data.gasPrice),
      maxFeePerGas: toOptionalString(data.maxFeePerGas),
      maxPriorityFeePerGas: toOptionalString(data.maxPriorityFeePerGas)
    })

    return transaction.unsignedHash
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
): SigningRequestVerification => {
  const base: SigningRequestVerification = {
    requestKind: 'transaction',
    hashes: [],
    missingHashReason: null,
    safeHashFormula: null,
    safeTransactionChecks: [],
    requestJson: stringify(data)
  }
  if (!isRecord(data)) return base

  if (isAccountUpgradeTransaction) {
    return {
      ...base,
      missingHashReason:
        "The transaction hash isn't shown because this transaction also upgrades your account, which is signed together with it."
    }
  }

  const transactionHash = getUnsignedTransactionHash(data)
  if (!transactionHash) {
    return {
      ...base,
      missingHashReason: "The transaction hash couldn't be calculated for this request."
    }
  }

  return {
    ...base,
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

const getSafeTransactionChecks = (message: Record<string, unknown>): SafeTransactionCheck[] => {
  const checks: SafeTransactionCheck[] = []
  const operation = toBigIntOrNull(message.operation)
  const to = typeof message.to === 'string' ? message.to.toLowerCase() : ''
  const isBatchContract = allowedMulticallContracts.some((addr) => addr.toLowerCase() === to)

  if (operation === BigInt(SAFE_CALL_OPERATION)) {
    checks.push({ id: 'operation', label: 'operation 0: a normal call', isPassing: true })
  } else if (operation === BigInt(SAFE_DELEGATE_CALL_OPERATION) && isBatchContract) {
    checks.push({
      id: 'operation',
      label: "operation 1: a delegate call to Safe's batch contract, which is normal for batches",
      isPassing: true
    })
  } else if (operation === BigInt(SAFE_DELEGATE_CALL_OPERATION)) {
    checks.push({
      id: 'operation',
      label:
        'operation 1: a delegate call to an unknown contract. It gets full control of the Safe.',
      isPassing: false
    })
  } else {
    checks.push({ id: 'operation', label: 'operation has an unknown value', isPassing: false })
  }

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

const getTypedDataVerification = (data: unknown): SigningRequestVerification => {
  const base: SigningRequestVerification = {
    requestKind: 'typed-data',
    hashes: [],
    missingHashReason: null,
    safeHashFormula: null,
    safeTransactionChecks: [],
    requestJson: stringify(data)
  }
  if (!isRecord(data)) return base

  const { domainHash, messageHash, safeTxHash, safeMessageHash } = data
  const safeHash = isHash(safeTxHash) ? safeTxHash : null
  const safeMessageHashValue = isHash(safeMessageHash) ? safeMessageHash : null
  const safeHashValue = safeHash ?? safeMessageHashValue
  const hashes: VerificationHash[] = []

  if (safeHash) {
    hashes.push({ id: 'safeTxHash', label: 'Safe transaction hash', value: safeHash })
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
    safeHashValue && isHash(domainHash) && isHash(messageHash)
      ? {
          isMatch:
            keccak256(concat(['0x1901', domainHash, messageHash])).toLowerCase() ===
            safeHashValue.toLowerCase()
        }
      : null

  const message = isRecord(data.message) ? data.message : null
  const isSafeTransaction = !!safeHash && !!message

  return {
    ...base,
    hashes,
    safeHashFormula,
    safeTransactionChecks: isSafeTransaction ? getSafeTransactionChecks(message) : [],
    // Only the typed data itself, so it can be pasted into a hashing tool as is
    requestJson: stringify(pickKeys(data, TYPED_DATA_KEYS))
  }
}

/**
 * Prepares what a user needs to verify a hardware wallet signing request on
 * their own: the request exactly as sent (ready to paste into a hashing
 * tool), the hashes Ambire computed from it, and for Safe transactions, the
 * checks that can be confirmed by reading the request.
 */
export const getSigningRequestVerification = (
  signingRequest: HardwareWalletSigningRequest,
  options: Options = {}
): SigningRequestVerification => {
  if (signingRequest.type === 'raw-transaction') {
    return getTransactionVerification(signingRequest.data, options)
  }
  if (signingRequest.type === 'eip-712') return getTypedDataVerification(signingRequest.data)

  return {
    requestKind: 'other',
    hashes: [],
    missingHashReason: null,
    safeHashFormula: null,
    safeTransactionChecks: [],
    requestJson: stringify(signingRequest.data)
  }
}
