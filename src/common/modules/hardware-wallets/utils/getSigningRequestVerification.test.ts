import { concat, keccak256, Transaction, ZeroAddress } from 'ethers'

import { multiSendAddr } from '@ambire-common/consts/safe'

import { getSigningRequestVerification } from './getSigningRequestVerification'

jest.mock('@common/config/analytics/CrashAnalytics', () => ({ captureException: jest.fn() }))

const RECIPIENT = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
const TOKEN = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
const SAFE = '0x5aFE3855358E112B5647B952709E6165e1c1eEEe'
const TRANSFER_DATA = `0xa9059cbb000000000000000000000000${RECIPIENT.slice(2)}${'0'.repeat(56)}05f5e100`

const DOMAIN_HASH = `0x${'1b'.repeat(32)}`
const MESSAGE_HASH = `0x${'e4'.repeat(32)}`
const SAFE_HASH = keccak256(concat(['0x1901', DOMAIN_HASH, MESSAGE_HASH]))

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
      expect(result.unsignedTransaction).toBe(expected.unsignedSerialized)
      expect(result.unsignedTransaction?.startsWith('0x02')).toBe(true)
      expect(result.missingHashReason).toBeNull()
      expect(JSON.parse(result.requestJson)).toEqual(eip1559Transaction)
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
    })

    test('a transaction that also upgrades the account gets no hash, as the request is not all that is signed', () => {
      const result = getSigningRequestVerification(
        { type: 'raw-transaction', data: eip1559Transaction },
        { isAccountUpgradeTransaction: true }
      )

      expect(result.hashes).toEqual([])
      expect(result.unsignedTransaction).toBeNull()
      expect(result.missingHashReason).toBeTruthy()
    })

    test('a request with fields a transaction does not have gets no hash', () => {
      const result = getSigningRequestVerification({
        type: 'raw-transaction',
        data: { chainId: '1', from: RECIPIENT, calls: [{ to: TOKEN, value: '0', data: '0x' }] }
      })

      expect(result.hashes).toEqual([])
      expect(result.missingHashReason).toBeTruthy()
    })

    test('malformed data gets no hash and keeps the JSON', () => {
      const result = getSigningRequestVerification({ type: 'raw-transaction', data: 'oops' })

      expect(result.hashes).toEqual([])
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

    test('a Safe hash that does not come from the domain and message hashes is flagged', () => {
      const request = getSafeTxRequest()
      const result = getSigningRequestVerification({
        ...request,
        data: { ...request.data, safeTxHash: `0x${'00'.repeat(32)}` }
      })

      expect(result.safeHashFormula).toEqual({ isMatch: false })
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

    test("a delegate call to Safe's batch contract passes", () => {
      const result = getSigningRequestVerification(
        getSafeTxRequest({ ...safeTxMessage, to: multiSendAddr.toLowerCase(), operation: '1' })
      )

      expect(result.safeTransactionChecks[0]?.isPassing).toBe(true)
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
  })

  test('messages and authorizations: only the JSON', () => {
    const result = getSigningRequestVerification({
      type: 'message',
      data: { message: `0x${'5d'.repeat(32)}` }
    })

    expect(result.requestKind).toBe('other')
    expect(result.hashes).toEqual([])
    expect(JSON.parse(result.requestJson)).toEqual({ message: `0x${'5d'.repeat(32)}` })
  })
})
