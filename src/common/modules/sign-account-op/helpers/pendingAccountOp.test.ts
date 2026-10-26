import { AccountOp } from '@ambire-common/libs/accountOp/accountOp'
import { SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'

import { getEarliestPendingAccountOp } from './pendingAccountOp'

const ACCOUNT = '0x714fD8A33a8eE16F7Fc39B3A1C4D9f3b7a7dDe5c'

const buildAccountOp = (overrides: Partial<AccountOp> = {}): AccountOp => ({
  id: 'signing-op',
  accountAddr: ACCOUNT,
  chainId: 1n,
  signingKeyAddr: null,
  signingKeyType: null,
  nonce: 10n,
  calls: [],
  gasLimit: null,
  signature: null,
  gasFeePayment: null,
  ...overrides
})

const buildPendingAccountOp = (
  id: string,
  overrides: Partial<SubmittedAccountOp> = {}
): SubmittedAccountOp => ({
  ...buildAccountOp({ id }),
  nonce: 8n,
  status: AccountOpStatus.BroadcastedButNotConfirmed,
  identifiedBy: { type: 'Transaction', identifier: `0x${id}` },
  timestamp: 1000,
  ...overrides
})

describe('getEarliestPendingAccountOp', () => {
  describe('Safe accounts', () => {
    test('returns the pending transaction with the lowest Safe nonce before the current one', () => {
      const result = getEarliestPendingAccountOp({
        accountOp: buildAccountOp(),
        isSafeAccount: true,
        accountStateNonce: 7n,
        isAccountStateNonceConfirmed: true,
        pendingAccountOps: [
          buildPendingAccountOp('second', { nonce: 9n, timestamp: 1 }),
          buildPendingAccountOp('first', { nonce: 8n, timestamp: 2 })
        ]
      })

      expect(result?.id).toBe('first')
    })

    test('ignores pending transactions whose nonce was already used onchain', () => {
      const result = getEarliestPendingAccountOp({
        accountOp: buildAccountOp(),
        isSafeAccount: true,
        accountStateNonce: 9n,
        isAccountStateNonceConfirmed: true,
        pendingAccountOps: [buildPendingAccountOp('used', { nonce: 8n })]
      })

      expect(result).toBeNull()
    })

    test('ignores pending transactions at or after the current nonce, e.g. the one sped up', () => {
      const result = getEarliestPendingAccountOp({
        accountOp: buildAccountOp(),
        isSafeAccount: true,
        accountStateNonce: 7n,
        isAccountStateNonceConfirmed: true,
        pendingAccountOps: [
          buildPendingAccountOp('same', { nonce: 10n }),
          buildPendingAccountOp('later', { nonce: 11n })
        ]
      })

      expect(result).toBeNull()
    })

    test('keeps pending transactions below a nonce that may count them too (Ethereum)', () => {
      // The state is read from the pending block, so the pending transaction at 8 already
      // raised the nonce to 9 there, and the transaction being signed got 9
      const result = getEarliestPendingAccountOp({
        accountOp: buildAccountOp({ nonce: 9n }),
        isSafeAccount: true,
        accountStateNonce: 9n,
        isAccountStateNonceConfirmed: false,
        pendingAccountOps: [buildPendingAccountOp('pending', { nonce: 8n })]
      })

      expect(result?.id).toBe('pending')
    })

    test('ignores pending transactions on other networks', () => {
      const result = getEarliestPendingAccountOp({
        accountOp: buildAccountOp(),
        isSafeAccount: true,
        accountStateNonce: 7n,
        isAccountStateNonceConfirmed: true,
        pendingAccountOps: [buildPendingAccountOp('other-chain', { chainId: 10n })]
      })

      expect(result).toBeNull()
    })
  })

  describe('sped up transactions', () => {
    const EOA = '0x77777777789A8BBEE6C64381e5E89E501fb0e4c8'
    // Sent by the same EOA with the same EOA nonce, so they replace each other
    const buildSentByEoa = (id: string, timestamp: number) =>
      buildPendingAccountOp(id, {
        eoaNonce: 5n,
        timestamp,
        gasFeePayment: {
          paidBy: EOA,
          paidByKeyType: 'internal',
          broadcastOption: 'bySelf',
          isGasTank: false,
          inToken: '0x0000000000000000000000000000000000000000',
          feeTokenChainId: 1n,
          amount: 1n,
          simulatedGasLimit: 1n,
          gasPrice: 1n,
          maxPriorityFeePerGas: 1n
        }
      })

    test.each([true, false])(
      'returns the newest of a transaction and its speed ups (Safe: %s)',
      (isSafeAccount) => {
        const result = getEarliestPendingAccountOp({
          accountOp: buildAccountOp(),
          isSafeAccount,
          accountStateNonce: 7n,
          isAccountStateNonceConfirmed: true,
          pendingAccountOps: [buildSentByEoa('original', 1000), buildSentByEoa('speed-up', 2000)]
        })

        expect(result?.id).toBe('speed-up')
      }
    )

    test('orders a speed up by when the transaction it replaces was first sent', () => {
      const speedUp = buildSentByEoa('speed-up', 3000)
      speedUp.meta = { speedUp: { enabled: true, replacedSentAt: 1000 } }
      const result = getEarliestPendingAccountOp({
        accountOp: buildAccountOp(),
        isSafeAccount: false,
        accountStateNonce: 10n,
        isAccountStateNonceConfirmed: true,
        pendingAccountOps: [
          buildSentByEoa('original', 1000),
          // sent after the original, but before it was sped up
          buildPendingAccountOp('next', { timestamp: 2000 }),
          speedUp
        ]
      })

      expect(result?.id).toBe('speed-up')
    })

    test('skips the original once its newest speed up is the one being replaced', () => {
      const speedUp = buildSentByEoa('speed-up', 2000)
      const result = getEarliestPendingAccountOp({
        accountOp: buildAccountOp({
          meta: { speedUp: { enabled: true, replacedIdentifiedBy: speedUp.identifiedBy } }
        }),
        isSafeAccount: false,
        accountStateNonce: 10n,
        isAccountStateNonceConfirmed: true,
        pendingAccountOps: [buildSentByEoa('original', 1000), speedUp]
      })

      expect(result).toBeNull()
    })
  })

  describe('other accounts', () => {
    test('returns the first sent pending transaction on the same network, whatever its nonce', () => {
      const result = getEarliestPendingAccountOp({
        accountOp: buildAccountOp(),
        isSafeAccount: false,
        accountStateNonce: 10n,
        isAccountStateNonceConfirmed: true,
        pendingAccountOps: [
          // a bundler nonce, unrelated to the account's own
          buildPendingAccountOp('later', { nonce: 3n, timestamp: 2000 }),
          buildPendingAccountOp('first', { nonce: 1n << 64n, timestamp: 1000 }),
          buildPendingAccountOp('other-chain', { chainId: 10n, timestamp: 1 })
        ]
      })

      expect(result?.id).toBe('first')
    })

    test('ignores the pending transaction that a speed up or a cancel replaces', () => {
      const replaced = buildPendingAccountOp('replaced', { timestamp: 1000 })
      const result = getEarliestPendingAccountOp({
        accountOp: buildAccountOp({
          meta: { speedUp: { enabled: true, replacedIdentifiedBy: replaced.identifiedBy } }
        }),
        isSafeAccount: false,
        accountStateNonce: 10n,
        isAccountStateNonceConfirmed: true,
        pendingAccountOps: [replaced, buildPendingAccountOp('after', { timestamp: 2000 })]
      })

      expect(result?.id).toBe('after')
    })

    test('ignores the transaction being signed once it shows up as pending', () => {
      const result = getEarliestPendingAccountOp({
        accountOp: buildAccountOp(),
        isSafeAccount: false,
        accountStateNonce: 10n,
        isAccountStateNonceConfirmed: true,
        pendingAccountOps: [buildPendingAccountOp('signing-op')]
      })

      expect(result).toBeNull()
    })

    test('returns null when nothing is pending', () => {
      const result = getEarliestPendingAccountOp({
        accountOp: buildAccountOp(),
        isSafeAccount: false,
        accountStateNonce: 10n,
        isAccountStateNonceConfirmed: true,
        pendingAccountOps: []
      })

      expect(result).toBeNull()
    })
  })
})
