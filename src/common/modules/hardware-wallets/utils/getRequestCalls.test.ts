import { concat, getAddress, Interface, solidityPacked, ZeroAddress } from 'ethers'

import { multiSendAddr } from '@ambire-common/consts/safe'
import { multiCallAbi } from '@ambire-common/libs/safe/helpers'

import {
  findHumanizedCall,
  getDecodedCallLines,
  getRequestCalls,
  isEmptyCallData,
  RequestCall
} from './getRequestCalls'

const TOKEN = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const RECIPIENT = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const SAFE = '0x5aFE3855358E112B5647B952709E6165e1c1eEEe'
const TRANSFER_DATA = `0xa9059cbb000000000000000000000000${RECIPIENT.slice(2).toLowerCase()}${'0'.repeat(56)}05f5e100`
const HASH = `0x${'ab'.repeat(32)}`

const safeTxMessage = {
  to: TOKEN,
  value: '0',
  data: TRANSFER_DATA,
  operation: 0,
  safeTxGas: '0',
  baseGas: '0',
  gasPrice: '0',
  gasToken: ZeroAddress,
  refundReceiver: ZeroAddress,
  nonce: '42'
}

const getSafeRequest = (message: Record<string, unknown>) => ({
  type: 'eip-712' as const,
  data: {
    domain: { chainId: '137', verifyingContract: SAFE },
    types: {},
    primaryType: 'SafeTx',
    message,
    safeTxHash: HASH,
    domainHash: HASH,
    messageHash: HASH
  }
})

const encodeBatch = (calls: { to: string; value: bigint; data: string }[]) =>
  new Interface(multiCallAbi).encodeFunctionData('multiSend', [
    concat(
      calls.map(({ to, value, data }) =>
        solidityPacked(
          ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
          [0, to, value, BigInt((data.length - 2) / 2), data]
        )
      )
    )
  ])

describe('getRequestCalls', () => {
  test('a transaction makes the one call in its fields', () => {
    expect(
      getRequestCalls({
        type: 'raw-transaction',
        data: { to: TOKEN, value: '5', data: TRANSFER_DATA, chainId: '137', nonce: 1 }
      })
    ).toEqual({
      kind: 'transaction',
      chainId: 137n,
      calls: [{ id: 'transaction', to: TOKEN, value: 5n, data: TRANSFER_DATA }]
    })
  })

  test('a Safe transaction makes its one call, on the chain of its domain', () => {
    const result = getRequestCalls(getSafeRequest(safeTxMessage))

    expect(result?.kind).toBe('safe-transaction')
    if (result?.kind !== 'safe-transaction') return

    expect(result.chainId).toBe(137n)
    expect(result.isBatch).toBe(false)
    expect(result.calls).toEqual([
      { id: 'transaction-1', to: TOKEN, value: 0n, data: TRANSFER_DATA, operation: 0 }
    ])
  })

  test('a Safe batch is split into its transactions, one by one', () => {
    const batchData = encodeBatch([
      { to: TOKEN, value: 0n, data: TRANSFER_DATA },
      { to: RECIPIENT, value: 7n, data: '0x' }
    ])
    const result = getRequestCalls(
      getSafeRequest({ ...safeTxMessage, to: multiSendAddr, data: batchData, operation: 1 })
    )

    if (result?.kind !== 'safe-transaction') throw new Error('expected a Safe transaction')

    expect(result.isBatch).toBe(true)
    expect(result.batchError).toBeNull()
    expect(result.calls).toEqual([
      { id: 'transaction-1', to: TOKEN, value: 0n, data: TRANSFER_DATA, operation: 0 },
      { id: 'transaction-2', to: getAddress(RECIPIENT), value: 7n, data: '0x', operation: 0 }
    ])
  })

  test('a delegate call to another contract is not read as a batch', () => {
    const batchData = encodeBatch([{ to: TOKEN, value: 0n, data: TRANSFER_DATA }])
    const result = getRequestCalls(
      getSafeRequest({ ...safeTxMessage, to: RECIPIENT, data: batchData, operation: 1 })
    )

    if (result?.kind !== 'safe-transaction') throw new Error('expected a Safe transaction')

    expect(result.isBatch).toBe(false)
    expect(result.calls).toHaveLength(1)
    expect(result.calls[0]?.data).toBe(batchData)
  })

  test('a batch that cannot be read is reported', () => {
    const result = getRequestCalls(
      getSafeRequest({ ...safeTxMessage, to: multiSendAddr, data: '0x8d80ff0a1234', operation: 1 })
    )

    if (result?.kind !== 'safe-transaction') throw new Error('expected a Safe transaction')

    expect(result.calls).toEqual([])
    expect(result.batchError).toBeTruthy()
  })

  test('other typed data, messages and malformed data have no calls', () => {
    const typedDataWithoutSafeHash = Object.fromEntries(
      Object.entries(getSafeRequest(safeTxMessage).data).filter(([key]) => key !== 'safeTxHash')
    )

    expect(getRequestCalls({ type: 'eip-712', data: typedDataWithoutSafeHash })).toBeNull()
    expect(getRequestCalls({ type: 'message', data: { message: HASH } })).toBeNull()
    expect(getRequestCalls({ type: 'raw-transaction', data: null })).toBeNull()
  })
})

describe('findHumanizedCall', () => {
  const call: RequestCall = { id: 'transaction-1', to: TOKEN, value: 0n, data: TRANSFER_DATA }

  test('matches the humanized call with the same recipient, value and data', () => {
    const humanizedCall = { id: 'a', to: TOKEN.toLowerCase(), value: 0n, data: TRANSFER_DATA }

    expect(findHumanizedCall(call, [humanizedCall])).toBe(humanizedCall)
  })

  test('does not match a call that differs in anything', () => {
    expect(
      findHumanizedCall(call, [
        { id: 'other-recipient', to: RECIPIENT, value: 0n, data: TRANSFER_DATA },
        { id: 'other-value', to: TOKEN, value: 1n, data: TRANSFER_DATA },
        { id: 'other-data', to: TOKEN, value: 0n, data: '0x' }
      ])
    ).toBeUndefined()
  })
})

describe('getDecodedCallLines', () => {
  test('nested arrays and calls are indented', () => {
    const lines = getDecodedCallLines({
      selector: '0x12345678',
      signature: 'execute((address,uint256,bytes)[])',
      diffInBytes: 0,
      args: [
        {
          key: 'calls',
          val: [
            { key: 'to', val: TOKEN },
            {
              key: 'data',
              val: {
                selector: '0xa9059cbb',
                signature: 'transfer(address,uint256)',
                diffInBytes: 0,
                args: [{ key: 'amount', val: 100n }]
              }
            }
          ]
        }
      ]
    })

    expect(lines.map(({ depth, text }) => [depth, text])).toEqual([
      [0, 'calls: ['],
      [1, `to: ${TOKEN}`],
      [1, 'data: transfer(address,uint256)'],
      [2, 'amount: 100'],
      [0, ']']
    ])
    expect(new Set(lines.map(({ id }) => id)).size).toBe(lines.length)
  })
})

test('isEmptyCallData', () => {
  expect(isEmptyCallData('0x')).toBe(true)
  expect(isEmptyCallData('')).toBe(true)
  expect(isEmptyCallData(TRANSFER_DATA)).toBe(false)
})
