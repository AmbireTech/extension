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
        pendingAccountOps: [buildPendingAccountOp('used', { nonce: 8n })]
      })

      expect(result).toBeNull()
    })

    test('ignores pending transactions at or after the current nonce, e.g. the one sped up', () => {
      const result = getEarliestPendingAccountOp({
        accountOp: buildAccountOp(),
        isSafeAccount: true,
        accountStateNonce: 7n,
        pendingAccountOps: [
          buildPendingAccountOp('same', { nonce: 10n }),
          buildPendingAccountOp('later', { nonce: 11n })
        ]
      })

      expect(result).toBeNull()
    })

    test('ignores pending transactions on other networks', () => {
      const result = getEarliestPendingAccountOp({
        accountOp: buildAccountOp(),
        isSafeAccount: true,
        accountStateNonce: 7n,
        pendingAccountOps: [buildPendingAccountOp('other-chain', { chainId: 10n })]
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
        pendingAccountOps: [replaced, buildPendingAccountOp('after', { timestamp: 2000 })]
      })

      expect(result?.id).toBe('after')
    })

    test('ignores the transaction being signed once it shows up as pending', () => {
      const result = getEarliestPendingAccountOp({
        accountOp: buildAccountOp(),
        isSafeAccount: false,
        accountStateNonce: 10n,
        pendingAccountOps: [buildPendingAccountOp('signing-op')]
      })

      expect(result).toBeNull()
    })

    test('returns null when nothing is pending', () => {
      const result = getEarliestPendingAccountOp({
        accountOp: buildAccountOp(),
        isSafeAccount: false,
        accountStateNonce: 10n,
        pendingAccountOps: []
      })

      expect(result).toBeNull()
    })
  })
})
