import {
  concat,
  hashMessage,
  Interface,
  keccak256,
  solidityPacked,
  Transaction,
  ZeroAddress
} from 'ethers'

import { multiSendAddr } from '@ambire-common/consts/safe'
import { multiCallAbi } from '@ambire-common/libs/safe/helpers'

import { getSigningRequestVerification } from './getSigningRequestVerification'

jest.mock('@common/config/analytics/CrashAnalytics', () => ({ captureException: jest.fn() }))

const RECIPIENT = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
const TOKEN = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const SAFE = '0x5aFE3855358E112B5647B952709E6165e1c1eEEe'
const TRANSFER_DATA = `0xa9059cbb000000000000000000000000${RECIPIENT.slice(2)}${'0'.repeat(56)}05f5e100`

const DOMAIN_HASH = `0x${'1b'.repeat(32)}`
const MESSAGE_HASH = `0x${'e4'.repeat(32)}`
const SAFE_HASH = keccak256(concat(['0x1901', DOMAIN_HASH, MESSAGE_HASH]))
/** ERC-8213 Calldata Digest, built like the Solidity reference in the ERC */
const TRANSFER_CALLDATA_DIGEST = keccak256(
  solidityPacked(['uint256', 'bytes'], [BigInt((TRANSFER_DATA.length - 2) / 2), TRANSFER_DATA])
)

const eip1559Transaction = {
  to: TOKEN,
  value: '0',
  data: TRANSFER_DATA,
  chainId: '137',
  nonce: 298,
  gasLimit: '70000',
  maxFeePerGas: '30000000000',
  maxPriorityFeePerGas: '1500000000',
  type: 2
}

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

const getSafeTxRequest = (message: Record<string, unknown> = safeTxMessage) => ({
  type: 'eip-712' as const,
  data: {
    domain: { chainId: '137', verifyingContract: SAFE },
    types: { SafeTx: [{ name: 'to', type: 'address' }] },
    primaryType: 'SafeTx',
    message,
    safeTxHash: SAFE_HASH,
    domainHash: DOMAIN_HASH,
    messageHash: MESSAGE_HASH
  }
})

const encodeBatch = (calls: { operation: number; to: string; data: string }[]) =>
  new Interface(multiCallAbi).encodeFunctionData('multiSend', [
    concat(
      calls.map(({ operation, to, data }) =>
        solidityPacked(
          ['uint8', 'address', 'uint256', 'uint256', 'bytes'],
          [operation, to, 0n, BigInt((data.length - 2) / 2), data]
        )
      )
    )
  ])

const getBatchMessage = (calls: { operation: number; to: string; data: string }[]) => ({
  ...safeTxMessage,
  to: multiSendAddr,
  data: encodeBatch(calls),
  operation: 1
})

describe('getSigningRequestVerification', () => {
  describe('transactions', () => {
    test('EIP-1559: the hash of the unsigned transaction, built like the Ledger signer does', () => {
      const result = getSigningRequestVerification({
        type: 'raw-transaction',
        data: eip1559Transaction
      })
      const expected = Transaction.from({
        ...eip1559Transaction,
        type: 2
      })

      expect(result.requestKind).toBe('transaction')
      expect(result.hashes).toEqual([
        expect.objectContaining({ id: 'transactionHash', value: expected.unsignedHash })
      ])
      expect(expected.unsignedSerialized.startsWith('0x02')).toBe(true)
      expect(result.missingHashReason).toBeNull()
      expect(JSON.parse(result.requestJson)).toEqual(eip1559Transaction)
    })

    test('ERC-8213: the Calldata Digest of the transaction data', () => {
      const result = getSigningRequestVerification({
        type: 'raw-transaction',
        data: eip1559Transaction
      })

      expect(result.erc8213Digests).toEqual([
        expect.objectContaining({
          id: 'calldataDigest',
          label: 'Calldata Digest',
          value: TRANSFER_CALLDATA_DIGEST
        })
      ])
    })

    test('ERC-8213: the Calldata Digest leaves out the chain, so it is the same on every chain', () => {
      const [mainnetDigest, polygonDigest] = ['1', '137'].map(
        (chainId) =>
          getSigningRequestVerification({
            type: 'raw-transaction',
            data: { ...eip1559Transaction, chainId }
          }).erc8213Digests[0]?.value
      )

      expect(mainnetDigest).toBe(TRANSFER_CALLDATA_DIGEST)
      expect(polygonDigest).toBe(mainnetDigest)
    })

    test('legacy: no max fee per gas means a type 0 transaction', () => {
      const legacyTransaction = {
        to: TOKEN,
        value: '1000',
        data: '0x',
        chainId: '1',
        nonce: 5,
        gasLimit: '21000',
        gasPrice: '20000000000',
        type: 0
      }
      const result = getSigningRequestVerification({
        type: 'raw-transaction',
        data: legacyTransaction
      })

      expect(result.hashes[0]?.value).toBe(
        Transaction.from({ ...legacyTransaction, type: 0 }).unsignedHash
      )
      // ERC-8213 shows the Calldata Digest only for non-empty calldata
      expect(result.erc8213Digests).toEqual([])
    })

    test('a transaction that also upgrades the account gets no hash, as the request is not all that is signed', () => {
      const result = getSigningRequestVerification(
        { type: 'raw-transaction', data: eip1559Transaction },
        { isAccountUpgradeTransaction: true }
      )

      expect(result.hashes).toEqual([])
      expect(result.missingHashReason).toBeTruthy()
      // The calldata is signed as is, so its digest is still shown
      expect(result.erc8213Digests.map(({ id, value }) => [id, value])).toEqual([
        ['calldataDigest', TRANSFER_CALLDATA_DIGEST]
      ])
    })

    test('a list of calls a device sends on its own gets no hash, but its calls', () => {
      const result = getSigningRequestVerification({
        type: 'raw-transaction',
        data: { chainId: '1', from: RECIPIENT, calls: [{ to: TOKEN, value: '0', data: '0x' }] }
      })

      expect(result.hashes).toEqual([])
      expect(result.missingHashReason).toBeTruthy()
      expect(result.requestCalls?.calls).toHaveLength(1)
      expect(result.erc8213Digests).toEqual([])
    })

    test('a request with fields a transaction does not have gets no hash', () => {
      const result = getSigningRequestVerification({
        type: 'raw-transaction',
        data: { ...eip1559Transaction, from: RECIPIENT }
      })

      expect(result.hashes).toEqual([])
      expect(result.missingHashReason).toBeTruthy()
    })

    test('malformed data gets no hash and keeps the JSON', () => {
      const result = getSigningRequestVerification({ type: 'raw-transaction', data: 'oops' })

      expect(result.hashes).toEqual([])
      expect(result.erc8213Digests).toEqual([])
      expect(result.requestJson).toBe('"oops"')
    })
  })

  describe('Safe transactions', () => {
    test('all three hashes, with the Safe hash first, and the formula that links them', () => {
      const result = getSigningRequestVerification(getSafeTxRequest())

      expect(result.requestKind).toBe('typed-data')
      expect(result.hashes.map(({ id, value }) => [id, value])).toEqual([
        ['safeTxHash', SAFE_HASH],
        ['domainHash', DOMAIN_HASH],
        ['messageHash', MESSAGE_HASH]
      ])
      expect(result.safeHashFormula).toEqual({ isMatch: true })
    })

    test('ERC-8213: the Calldata Digest of what the Safe runs, without an EIP-712 Digest that repeats the Safe hash', () => {
      const result = getSigningRequestVerification(getSafeTxRequest())

      expect(result.erc8213Digests.map(({ id, label, value }) => [id, label, value])).toEqual([
        ['safeCalldataDigest', 'Calldata Digest', TRANSFER_CALLDATA_DIGEST]
      ])
    })

    test('ERC-8213: a Safe transaction without data has no digests, as the Safe hash is its EIP-712 Digest', () => {
      const result = getSigningRequestVerification(
        getSafeTxRequest({ ...safeTxMessage, to: RECIPIENT, value: '1000', data: '0x' })
      )

      expect(result.erc8213Digests).toEqual([])
    })

    test('a Safe hash that does not come from the domain and message hashes is flagged', () => {
      const request = getSafeTxRequest()
      const result = getSigningRequestVerification({
        ...request,
        data: { ...request.data, safeTxHash: `0x${'00'.repeat(32)}` }
      })

      expect(result.safeHashFormula).toEqual({ isMatch: false })
      // The EIP-712 Digest is built from the domain and message hashes, never
      // copied from the Safe hash sent with the request, and it's shown as it's
      // the hash the device actually signs when the two differ
      expect(result.erc8213Digests.map(({ id, value }) => [id, value])).toEqual([
        ['eip712Digest', SAFE_HASH],
        ['safeCalldataDigest', TRANSFER_CALLDATA_DIGEST]
      ])
    })

    test('the JSON is only the typed data, so it can be pasted into a hashing tool', () => {
      const result = getSigningRequestVerification(getSafeTxRequest())

      expect(Object.keys(JSON.parse(result.requestJson))).toEqual([
        'domain',
        'types',
        'primaryType',
        'message'
      ])
    })

    test('a normal call without a gas refund passes both checks', () => {
      const result = getSigningRequestVerification(getSafeTxRequest())

      expect(result.safeTransactionChecks.map(({ id, isPassing }) => [id, isPassing])).toEqual([
        ['operation', true],
        ['gas-refund', true]
      ])
    })

    test("a delegate call to Safe's batch contract that isn't a batch fails", () => {
      const result = getSigningRequestVerification(
        getSafeTxRequest({ ...safeTxMessage, to: multiSendAddr.toLowerCase(), operation: '1' })
      )

      expect(result.safeTransactionChecks[0]?.isPassing).toBe(false)
      expect(result.requestCalls?.kind === 'safe-transaction' && result.requestCalls.isBatch).toBe(
        false
      )
    })

    test("a batch that can't be read fails, as it could hide a delegate call", () => {
      const result = getSigningRequestVerification(
        getSafeTxRequest({
          ...safeTxMessage,
          to: multiSendAddr,
          data: '0x8d80ff0a1234',
          operation: 1
        })
      )

      expect(result.safeTransactionChecks.map(({ id, isPassing }) => [id, isPassing])).toEqual([
        ['operation', true],
        ['batch-unreadable', false],
        ['gas-refund', true]
      ])
    })

    test('the calls are read once and returned with the checks', () => {
      const result = getSigningRequestVerification(
        getSafeTxRequest(getBatchMessage([{ operation: 0, to: TOKEN, data: TRANSFER_DATA }]))
      )

      expect(result.requestCalls?.kind).toBe('safe-transaction')
      expect(result.requestCalls?.calls).toHaveLength(1)
    })

    test('a batch of normal calls adds no check for the calls inside it', () => {
      const result = getSigningRequestVerification(
        getSafeTxRequest(
          getBatchMessage([
            { operation: 0, to: TOKEN, data: TRANSFER_DATA },
            { operation: 0, to: RECIPIENT, data: '0x' }
          ])
        )
      )

      expect(result.safeTransactionChecks.map(({ id, isPassing }) => [id, isPassing])).toEqual([
        ['operation', true],
        ['gas-refund', true]
      ])
    })

    test('a delegate call inside the batch fails, even though the batch contract passes', () => {
      const result = getSigningRequestVerification(
        getSafeTxRequest(
          getBatchMessage([
            { operation: 0, to: TOKEN, data: TRANSFER_DATA },
            { operation: 1, to: RECIPIENT, data: '0x' }
          ])
        )
      )

      expect(result.safeTransactionChecks.map(({ id, isPassing }) => [id, isPassing])).toEqual([
        ['operation', true],
        ['batch-operation', false],
        ['gas-refund', true]
      ])
    })

    test('a delegate call to any other contract fails', () => {
      const result = getSigningRequestVerification(
        getSafeTxRequest({ ...safeTxMessage, operation: 1 })
      )

      expect(result.safeTransactionChecks[0]?.isPassing).toBe(false)
    })

    test('an unknown operation fails', () => {
      const result = getSigningRequestVerification(
        getSafeTxRequest({ ...safeTxMessage, operation: 2 })
      )

      expect(result.safeTransactionChecks[0]?.isPassing).toBe(false)
    })

    test.each([
      ['gasPrice', '1'],
      ['gasToken', TOKEN],
      ['refundReceiver', RECIPIENT]
    ])('a gas refund set through %s fails', (key, value) => {
      const result = getSigningRequestVerification(
        getSafeTxRequest({ ...safeTxMessage, [key]: value })
      )

      expect(result.safeTransactionChecks.find(({ id }) => id === 'gas-refund')?.isPassing).toBe(
        false
      )
    })
  })

  describe('Safe transactions from dapps, without the Safe hash', () => {
    const getDappSafeTxRequest = (message: Record<string, unknown> = safeTxMessage) => ({
      type: 'eip-712' as const,
      data: Object.fromEntries(
        Object.entries(getSafeTxRequest(message).data).filter(([key]) => key !== 'safeTxHash')
      )
    })

    test('the Safe hash is calculated from the domain and message hashes, without the formula check', () => {
      const result = getSigningRequestVerification(getDappSafeTxRequest())

      expect(result.hashes.map(({ id, value }) => [id, value])).toEqual([
        ['safeTxHash', SAFE_HASH],
        ['domainHash', DOMAIN_HASH],
        ['messageHash', MESSAGE_HASH]
      ])
      expect(result.hashes[0]?.note).toBeTruthy()
      expect(result.safeHashFormula).toBeNull()
      // The calculated Safe hash is the EIP-712 Digest, so it isn't repeated
      expect(result.erc8213Digests.map(({ id, value }) => [id, value])).toEqual([
        ['safeCalldataDigest', TRANSFER_CALLDATA_DIGEST]
      ])
    })

    test('the Safe checks run', () => {
      const result = getSigningRequestVerification(getDappSafeTxRequest())

      expect(result.safeTransactionChecks.map(({ id, isPassing }) => [id, isPassing])).toEqual([
        ['operation', true],
        ['gas-refund', true]
      ])
    })

    test('a delegate call to an unknown contract fails', () => {
      const result = getSigningRequestVerification(
        getDappSafeTxRequest({ ...safeTxMessage, operation: '1' })
      )

      expect(result.safeTransactionChecks[0]?.isPassing).toBe(false)
    })

    test('a delegate call inside the batch fails', () => {
      const result = getSigningRequestVerification(
        getDappSafeTxRequest(getBatchMessage([{ operation: 1, to: RECIPIENT, data: '0x' }]))
      )

      expect(
        result.safeTransactionChecks.find(({ id }) => id === 'batch-operation')?.isPassing
      ).toBe(false)
    })

    test('typed data with a SafeTx primary type but no message object gets no checks', () => {
      const { data } = getDappSafeTxRequest()
      const result = getSigningRequestVerification({
        type: 'eip-712',
        data: { ...data, message: 'oops' }
      })

      expect(result.safeTransactionChecks).toEqual([])
    })
  })

  test('Safe message: the Safe message hash and the formula, but no transaction checks', () => {
    const result = getSigningRequestVerification({
      type: 'eip-712',
      data: {
        domain: { chainId: '1', verifyingContract: SAFE },
        types: { SafeMessage: [{ name: 'message', type: 'bytes' }] },
        primaryType: 'SafeMessage',
        message: { message: '0x1234' },
        safeMessageHash: SAFE_HASH,
        domainHash: DOMAIN_HASH,
        messageHash: MESSAGE_HASH
      }
    })

    expect(result.hashes.map(({ id }) => id)).toEqual([
      'safeMessageHash',
      'domainHash',
      'messageHash'
    ])
    expect(result.safeHashFormula).toEqual({ isMatch: true })
    expect(result.safeTransactionChecks).toEqual([])
    // A Safe message runs no data, so it has no Calldata Digest, and the Safe
    // message hash is its EIP-712 Digest
    expect(result.erc8213Digests).toEqual([])
  })

  test('other typed data (e.g. an Ambire smart account): domain and message hashes only', () => {
    const result = getSigningRequestVerification({
      type: 'eip-712',
      data: {
        domain: { name: 'Ambire', version: '1', chainId: '137', verifyingContract: SAFE },
        types: {},
        primaryType: 'AmbireOperation',
        message: { account: SAFE, hash: `0x${'5d'.repeat(32)}` },
        domainHash: DOMAIN_HASH,
        messageHash: MESSAGE_HASH
      }
    })

    expect(result.hashes.map(({ id }) => id)).toEqual(['domainHash', 'messageHash'])
    expect(result.safeHashFormula).toBeNull()
    expect(result.safeTransactionChecks).toEqual([])
    expect(result.erc8213Digests.map(({ id, value }) => [id, value])).toEqual([
      ['eip712Digest', SAFE_HASH]
    ])
  })

  test('messages: the JSON and the ERC-8213 ERC-191 Digest of the bytes the hex encodes', () => {
    const message = `0x${'5d'.repeat(32)}`
    const result = getSigningRequestVerification({ type: 'message', data: { message } })

    expect(result.requestKind).toBe('other')
    expect(result.hashes).toEqual([])
    expect(result.erc8213Digests).toEqual([
      expect.objectContaining({
        id: 'erc191Digest',
        label: 'ERC-191 Digest',
        value: hashMessage(Buffer.from('5d'.repeat(32), 'hex'))
      })
    ])
    // Hashing the hex as text would sign something else
    expect(result.erc8213Digests[0]?.value).not.toBe(hashMessage(message))
    expect(JSON.parse(result.requestJson)).toEqual({ message })
  })

  test('a text message that cannot be encoded gets no digest instead of breaking the screen', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    const result = getSigningRequestVerification({
      type: 'message',
      data: { message: 'broken \uD800 emoji' }
    })

    expect(result.erc8213Digests).toEqual([])
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  test('authorizations: only the JSON', () => {
    const result = getSigningRequestVerification({
      type: 'eip-7702-authorization',
      data: { chainId: '1', contract: SAFE, nonce: '0' }
    })

    expect(result.requestKind).toBe('other')
    expect(result.hashes).toEqual([])
    expect(result.erc8213Digests).toEqual([])
  })
})
