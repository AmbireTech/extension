import { getAddress, Interface } from 'ethers'

import { DecodedCall } from '@ambire-common/interfaces/decodeCall'
import { HardwareWalletSigningRequest } from '@ambire-common/interfaces/signAccountOp'
import {
  decodeMultiSend,
  multiCallAbi,
  SAFE_DELEGATE_CALL_OPERATION
} from '@ambire-common/libs/safe/helpers'

import {
  isRecord,
  isSafeBatchContract,
  isSafeTxTypedData,
  toBigIntOrNull
} from './signingRequestData'

import type { IrCall } from '@ambire-common/libs/humanizer/interfaces'
/** A call taken from the signed request, with its call data still to be decoded */
export type RequestCall = {
  /** The position of the call in the request, e.g. `transaction-2` */
  id: string
  to: string | null
  value: bigint
  data: string
  /** Only set for Safe calls: 0 is a normal call, 1 a delegate call */
  operation?: number
}

export type RequestCalls =
  | { kind: 'transaction'; chainId: bigint | null; calls: RequestCall[] }
  | {
      kind: 'safe-transaction'
      chainId: bigint | null
      calls: RequestCall[]
      /** The Safe transaction runs a batch through Safe's batch contract */
      isBatch: boolean
      /** Why part of the batch couldn't be read. The calls before it are still listed */
      batchError: string | null
    }

/** One line of a decoded call, indented by its depth in the call */
export type DecodedCallLine = {
  /** The path of the argument in the call, e.g. `1.0` */
  id: string
  depth: number
  text: string
}

const multiSendInterface = new Interface(multiCallAbi)
const MULTI_SEND_SELECTOR = multiSendInterface.getFunction('multiSend')?.selector ?? '0x8d80ff0a'

const toBigIntOrZero = (value: unknown): bigint => toBigIntOrNull(value) ?? 0n

const toChecksumAddress = (value: unknown): string | null => {
  if (typeof value !== 'string' || value === '') return null

  try {
    return getAddress(value)
  } catch {
    // Not an address, so it's shown as it was sent
    return value
  }
}

const getTransactionCalls = (data: unknown): RequestCalls | null => {
  if (!isRecord(data) || typeof data.data !== 'string') return null

  return {
    kind: 'transaction',
    chainId: toBigIntOrNull(data.chainId),
    calls: [
      {
        id: 'transaction',
        to: toChecksumAddress(data.to),
        value: toBigIntOrZero(data.value),
        data: data.data
      }
    ]
  }
}

const getBatchCalls = (data: string): { calls: RequestCall[]; batchError: string | null } => {
  let transactionsHex: string

  try {
    transactionsHex = multiSendInterface.decodeFunctionData('multiSend', data)[0]
  } catch {
    return { calls: [], batchError: "The batch couldn't be read." }
  }

  const calls: RequestCall[] = []
  let batchError: string | null = null

  decodeMultiSend(transactionsHex).forEach((entry, index) => {
    if (!entry.success) {
      batchError = `Transaction ${index + 1} of the batch couldn't be read: ${entry.reason}`
      return
    }

    calls.push({
      id: `transaction-${index + 1}`,
      to: toChecksumAddress(entry.to),
      value: entry.value,
      data: entry.data,
      operation: entry.operation
    })
  })

  return { calls, batchError }
}

const getSafeTransactionCalls = (data: unknown): RequestCalls | null => {
  if (!isSafeTxTypedData(data)) return null

  const { message } = data
  const callData = typeof message.data === 'string' ? message.data : '0x'
  const operation = Number(toBigIntOrZero(message.operation))
  const to = toChecksumAddress(message.to)
  const isBatch =
    operation === SAFE_DELEGATE_CALL_OPERATION &&
    isSafeBatchContract(to) &&
    callData.toLowerCase().startsWith(MULTI_SEND_SELECTOR)

  const chainId = isRecord(data.domain) ? toBigIntOrNull(data.domain.chainId) : null

  if (isBatch) {
    return { kind: 'safe-transaction', chainId, isBatch, ...getBatchCalls(callData) }
  }

  return {
    kind: 'safe-transaction',
    chainId,
    isBatch,
    batchError: null,
    calls: [
      {
        id: 'transaction-1',
        to,
        value: toBigIntOrZero(message.value),
        data: callData,
        operation
      }
    ]
  }
}

/**
 * Lists the calls a signing request will make, read from the request itself
 * (not from what Ambire showed earlier), so they always match what's signed.
 * A transaction makes one call. A Safe transaction makes its call, or the
 * calls of its batch one by one.
 */
export const getRequestCalls = (
  signingRequest: HardwareWalletSigningRequest
): RequestCalls | null => {
  if (signingRequest.type === 'raw-transaction') return getTransactionCalls(signingRequest.data)
  if (signingRequest.type === 'eip-712') return getSafeTransactionCalls(signingRequest.data)

  return null
}

const isDecodedCall = (value: unknown): value is DecodedCall =>
  isRecord(value) && typeof value.signature === 'string' && Array.isArray(value.args)

const getArgLines = (
  args: DecodedCall['args'],
  depth: number,
  parentId: string
): DecodedCallLine[] =>
  args.flatMap((arg, index) => {
    const id = parentId ? `${parentId}.${index}` : `${index}`
    const { key, val } = arg

    if (Array.isArray(val)) {
      return [
        { id: `${id}-open`, depth, text: `${key}: [` },
        ...getArgLines(val, depth + 1, id),
        { id: `${id}-close`, depth, text: ']' }
      ]
    }
    if (isDecodedCall(val)) {
      return [
        { id, depth, text: `${key}: ${val.signature}` },
        ...getArgLines(val.args, depth + 1, id)
      ]
    }

    return [{ id, depth, text: `${key}: ${val.toString()}` }]
  })

/** Lays out the arguments of a decoded call as indented lines, nested calls included */
export const getDecodedCallLines = (decodedCall: DecodedCall): DecodedCallLine[] =>
  getArgLines(decodedCall.args, 0, '')

/**
 * Finds what Ambire showed for a signed call: the humanized call with exactly
 * the same recipient, value and data. Calls Ambire added on its own (e.g. the
 * fee) have no match.
 */
export const findHumanizedCall = (call: RequestCall, humanization: IrCall[]): IrCall | undefined =>
  humanization.find(
    (humanizedCall) =>
      (humanizedCall.to ?? '').toLowerCase() === (call.to ?? '').toLowerCase() &&
      toBigIntOrNull(humanizedCall.value) === call.value &&
      humanizedCall.data.toLowerCase() === call.data.toLowerCase()
  )

/** A call without data only sends value */
export const isEmptyCallData = (data: string) => data === '' || data === '0x'
