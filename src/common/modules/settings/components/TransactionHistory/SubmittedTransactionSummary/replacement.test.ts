import { ZeroAddress } from 'ethers'

import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'
import { BROADCAST_OPTIONS } from '@ambire-common/libs/broadcast/broadcast'

import {
  canBuildReplacementAccountOp,
  getReplacementAccountOp,
  getReplacementBlocker,
  isPartiallyMinedBatch,
  isReplaceableBroadcast
} from './replacement'
import { SubmittedAccountOpLike } from './types'

const accountAddr = '0x714fD3Db837e72bD49B8edA02B8f4D53DfdDe5ce'
const recipient = '0xc4ce03b36f057591b2a360d773edb9896255051e'

const buildPendingAccountOp = (
  overrides: Partial<SubmittedAccountOpLike> = {}
): SubmittedAccountOpLike => ({
  id: 'pending-op',
  accountAddr,
  chainId: 8453n,
  calls: [{ to: recipient, value: 1n, data: '0x' }],
  gasFeePayment: {
    isGasTank: false,
    paidBy: accountAddr,
    paidByKeyType: 'internal',
    inToken: ZeroAddress,
    amount: 1000n,
    simulatedGasLimit: 21000n,
    gasPrice: 100n,
    maxPriorityFeePerGas: 10n,
    broadcastOption: BROADCAST_OPTIONS.bySelf
  },
  status: AccountOpStatus.BroadcastedButNotConfirmed,
  timestamp: 1000,
  identifiedBy: { type: 'Transaction', identifier: '0xtxn' },
  signingKeyAddr: accountAddr,
  signingKeyType: 'internal',
  nonce: 7n,
  eoaNonce: 12n,
  gasLimit: 21000,
  signature: '0xsig',
  ...overrides
})

const withBroadcastOption = (broadcastOption: string) => {
  const op = buildPendingAccountOp()

  return buildPendingAccountOp({ gasFeePayment: { ...op.gasFeePayment!, broadcastOption } })
}

describe('canBuildReplacementAccountOp', () => {
  test('a sent transaction with all its details can be replaced', () => {
    expect(canBuildReplacementAccountOp(buildPendingAccountOp())).toBe(true)
  })

  test.each(['signingKeyAddr', 'signingKeyType', 'nonce', 'gasLimit', 'signature'] as const)(
    'needs %s',
    (field) => {
      expect(canBuildReplacementAccountOp(buildPendingAccountOp({ [field]: undefined }))).toBe(
        false
      )
    }
  )

  test('needs the fee payment, as the replacement must be sent and paid the same way', () => {
    expect(canBuildReplacementAccountOp(buildPendingAccountOp({ gasFeePayment: null }))).toBe(false)
  })
})

describe('isPartiallyMinedBatch', () => {
  test('a batch sent as one transaction per call with a processed call', () => {
    const op = buildPendingAccountOp({
      identifiedBy: { type: 'MultipleTxns', identifier: '0xa-0xb' },
      calls: [
        { to: recipient, value: 1n, data: '0x', status: AccountOpStatus.Success },
        { to: recipient, value: 2n, data: '0x' }
      ]
    })

    expect(isPartiallyMinedBatch(op)).toBe(true)
  })

  test('a batch sent as one transaction per call that is still fully pending', () => {
    const op = buildPendingAccountOp({
      identifiedBy: { type: 'MultipleTxns', identifier: '0xa-0xb' },
      calls: [
        { to: recipient, value: 1n, data: '0x' },
        { to: recipient, value: 2n, data: '0x' }
      ]
    })

    expect(isPartiallyMinedBatch(op)).toBe(false)
  })

  test('a single transaction is never a partly mined batch', () => {
    const op = buildPendingAccountOp({
      calls: [{ to: recipient, value: 1n, data: '0x', status: AccountOpStatus.Success }]
    })

    expect(isPartiallyMinedBatch(op)).toBe(false)
  })
})

describe('isReplaceableBroadcast', () => {
  test.each([
    ['an EOA', BROADCAST_OPTIONS.bySelf],
    ['a 7702 EOA', BROADCAST_OPTIONS.bySelf7702],
    ['an EOA that delegates', BROADCAST_OPTIONS.delegation],
    ['a smart account sent by another account', BROADCAST_OPTIONS.byOtherEOA]
  ])('a transaction sent by %s can be replaced', (_, broadcastOption) => {
    expect(isReplaceableBroadcast(withBroadcastOption(broadcastOption))).toBe(true)
  })

  test.each([
    ['the relayer', BROADCAST_OPTIONS.byRelayer],
    ['a bundler', BROADCAST_OPTIONS.byBundler]
  ])('a transaction sent by %s cannot be replaced', (_, broadcastOption) => {
    expect(isReplaceableBroadcast(withBroadcastOption(broadcastOption))).toBe(false)
  })

  test('a transaction without its fee payment cannot be replaced', () => {
    expect(isReplaceableBroadcast(buildPendingAccountOp({ gasFeePayment: null }))).toBe(false)
  })
})

describe('getReplacementBlocker', () => {
  test.each([
    ['an EOA', BROADCAST_OPTIONS.bySelf],
    ['a 7702 EOA', BROADCAST_OPTIONS.bySelf7702],
    ['an EOA that delegates', BROADCAST_OPTIONS.delegation],
    ['a smart account sent by another account', BROADCAST_OPTIONS.byOtherEOA]
  ])('%s can be replaced', (_, broadcastOption) => {
    expect(getReplacementBlocker(withBroadcastOption(broadcastOption), true)).toBeNull()
  })

  test.each([
    ['the relayer', BROADCAST_OPTIONS.byRelayer],
    ['a bundler', BROADCAST_OPTIONS.byBundler]
  ])('a transaction sent by %s cannot be replaced', (_, broadcastOption) => {
    expect(getReplacementBlocker(withBroadcastOption(broadcastOption), true)).toBe('notReplaceable')
  })

  test('an incoming transaction cannot be replaced', () => {
    const op = buildPendingAccountOp({ activitySource: 'external' })

    expect(getReplacementBlocker(op, true)).toBe('external')
  })

  test('a transaction of another account cannot be replaced from here', () => {
    expect(getReplacementBlocker(buildPendingAccountOp(), false)).toBe('otherAccount')
  })

  test('a transaction without its fee payment cannot be replaced', () => {
    expect(getReplacementBlocker(buildPendingAccountOp({ gasFeePayment: null }), true)).toBe(
      'notReplaceable'
    )
  })

  test('a transaction missing its details cannot be replaced', () => {
    expect(getReplacementBlocker(buildPendingAccountOp({ signature: undefined }), true)).toBe(
      'missingDetails'
    )
  })

  test('a partly mined batch cannot be replaced', () => {
    const op = buildPendingAccountOp({
      identifiedBy: { type: 'MultipleTxns', identifier: '0xa-0xb' },
      calls: [
        { to: recipient, value: 1n, data: '0x', status: AccountOpStatus.Failure },
        { to: recipient, value: 2n, data: '0x' }
      ]
    })

    expect(getReplacementBlocker(op, true)).toBe('partiallyMined')
  })
})

describe('getReplacementAccountOp', () => {
  test('a speed up is the pending transaction as it was sent, marked as a speed up', () => {
    const pendingOp = buildPendingAccountOp()
    const accountOp = getReplacementAccountOp(pendingOp, 'speedUp')

    expect(accountOp).toMatchObject({
      accountAddr,
      chainId: 8453n,
      calls: pendingOp.calls,
      nonce: 7n,
      eoaNonce: 12n,
      signature: '0xsig',
      gasFeePayment: pendingOp.gasFeePayment
    })
    expect(accountOp?.meta?.speedUp).toEqual({
      enabled: true,
      replacedFees: { gasPrice: 100n, maxPriorityFeePerGas: 10n, amount: 1000n },
      replacedSentAt: 1000,
      replacedIdentifiedBy: pendingOp.identifiedBy,
      replacedNonce: 7n
    })
  })

  test('a cancel is marked as a cancel', () => {
    const accountOp = getReplacementAccountOp(buildPendingAccountOp(), 'cancel')

    expect(accountOp?.meta?.speedUp?.isCancel).toBe(true)
  })

  test('speeding up a pending cancel keeps it a cancel, with the nonce it cancels', () => {
    const pendingCancel = buildPendingAccountOp({
      meta: { speedUp: { enabled: true, isCancel: true, replacedNonce: 5n, replacedSentAt: 500 } }
    })

    const accountOp = getReplacementAccountOp(pendingCancel, 'speedUp')

    expect(accountOp?.meta?.speedUp).toMatchObject({
      isCancel: true,
      replacedNonce: 5n,
      // The time of the very first attempt is kept
      replacedSentAt: 500
    })
  })

  test('speeding up a sped up transaction keeps the time of the very first attempt', () => {
    const spedUp = buildPendingAccountOp({
      meta: { speedUp: { enabled: true, replacedSentAt: 500 } }
    })

    expect(getReplacementAccountOp(spedUp, 'speedUp')?.meta?.speedUp?.replacedSentAt).toBe(500)
  })

  test('a speed up of a transaction that is not a cancel is not turned into one', () => {
    const accountOp = getReplacementAccountOp(buildPendingAccountOp(), 'speedUp')

    expect(accountOp?.meta?.speedUp?.isCancel).toBeUndefined()
  })

  test.each(['speedUp', 'cancel'] as const)(
    'a %s records the account nonce the pending transaction was signed with',
    (replacement) => {
      const accountOp = getReplacementAccountOp(buildPendingAccountOp({ nonce: 7n }), replacement)

      expect(accountOp?.meta?.speedUp?.replacedNonce).toBe(7n)
    }
  )

  test('canceling a pending smart account speed up signs with the nonce of the first attempt', () => {
    // A smart account speed up is stored with the next nonce, but its signature is for the
    // nonce of the first attempt, which it recorded
    const pendingSpeedUp = buildPendingAccountOp({
      nonce: 8n,
      meta: { speedUp: { enabled: true, replacedNonce: 7n } }
    })

    const accountOp = getReplacementAccountOp(pendingSpeedUp, 'cancel')

    expect(accountOp?.meta?.speedUp).toMatchObject({ isCancel: true, replacedNonce: 7n })
  })

  test('a recorded nonce of 0 is kept', () => {
    const pendingSpeedUp = buildPendingAccountOp({
      nonce: 1n,
      meta: { speedUp: { enabled: true, replacedNonce: 0n } }
    })

    expect(getReplacementAccountOp(pendingSpeedUp, 'cancel')?.meta?.speedUp?.replacedNonce).toBe(0n)
  })

  test('is null when the transaction lacks what is needed to replace it', () => {
    expect(
      getReplacementAccountOp(buildPendingAccountOp({ nonce: undefined }), 'cancel')
    ).toBeNull()
    expect(
      getReplacementAccountOp(buildPendingAccountOp({ gasFeePayment: null }), 'speedUp')
    ).toBeNull()
  })
})
