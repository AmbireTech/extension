import { Interface } from 'ethers'

import {
  decodePendingWalletWithdrawals,
  formatPendingWalletWithdrawalDuration,
  getActivePendingWalletWithdrawals,
  getPendingWalletWithdrawalCommitmentId,
  getPendingWalletWithdrawalStorageKey,
  getPendingWalletWithdrawalSummary,
  isPendingWalletWithdrawalReady,
  LOG_LEAVE_TOPIC,
  parseCachedPendingWalletWithdrawal,
  parseWalletStakingRelayerLogsResponse,
  serializePendingWalletWithdrawal,
  shouldUsePendingWalletWithdrawalMode,
  walletStakingInterface
} from './pendingWithdrawal'

const ACCOUNT = '0x0000000000000000000000000000000000000001'
const OTHER_ACCOUNT = '0x0000000000000000000000000000000000000002'
const pendingWithdrawal = {
  shares: 10n,
  unlocksAt: 2_592_000n,
  maxTokens: 12n
}

describe('pending WALLET withdrawal helpers', () => {
  test('selects the latest timer and totals the shares from all active withdrawals', () => {
    const latestWithdrawal = {
      shares: 20n,
      unlocksAt: pendingWithdrawal.unlocksAt + 2n * 24n * 60n * 60n,
      maxTokens: 24n
    }

    expect(getPendingWalletWithdrawalSummary([pendingWithdrawal, latestWithdrawal])).toEqual({
      latestWithdrawal,
      totalShares: 30n
    })
  })

  test('keeps successful active withdrawals when another commitment check fails', async () => {
    const failedWithdrawal = { ...pendingWithdrawal, shares: 20n, unlocksAt: 3_000_000n }
    const inactiveWithdrawal = { ...pendingWithdrawal, shares: 30n, unlocksAt: 4_000_000n }
    const failure = new Error('Unable to check commitment')

    const result = await getActivePendingWalletWithdrawals(
      [pendingWithdrawal, failedWithdrawal, inactiveWithdrawal],
      async (withdrawal) => {
        if (withdrawal === failedWithdrawal) throw failure
        return withdrawal === inactiveWithdrawal ? 0n : 15n
      }
    )

    expect(result).toEqual({
      activeWithdrawals: [{ ...pendingWithdrawal, maxTokens: 15n }],
      errors: [failure]
    })
  })

  test('uses the lock-time flow for every fully backed pending withdrawal, including small ones', () => {
    const smallPendingShares = 470_878_895_989_112n

    expect(
      shouldUsePendingWalletWithdrawalMode(
        { ...pendingWithdrawal, shares: smallPendingShares },
        smallPendingShares,
        smallPendingShares
      )
    ).toBe(true)
    expect(shouldUsePendingWalletWithdrawalMode(pendingWithdrawal, 11n, 10n)).toBe(true)
    expect(shouldUsePendingWalletWithdrawalMode(pendingWithdrawal, 9n, 10n)).toBe(false)
    expect(shouldUsePendingWalletWithdrawalMode(null, 10n, 10n)).toBe(false)
  })

  test('serializes and parses an account-specific cache entry', () => {
    expect(getPendingWalletWithdrawalStorageKey(ACCOUNT.toUpperCase())).toBe(
      `walletStakingPendingWithdrawal:${ACCOUNT}`
    )
    expect(
      parseCachedPendingWalletWithdrawal(serializePendingWalletWithdrawal(pendingWithdrawal))
    ).toEqual(pendingWithdrawal)
  })

  test.each([
    null,
    {},
    { shares: '0', unlocksAt: '1', maxTokens: '1' },
    { shares: '1', unlocksAt: 'invalid', maxTokens: '1' }
  ])('rejects an invalid cache entry: %p', (cachedValue) => {
    expect(parseCachedPendingWalletWithdrawal(cachedValue)).toBeNull()
  })

  test('decodes only LogLeave events owned by the selected account', () => {
    const event = walletStakingInterface.encodeEventLog(
      walletStakingInterface.getEvent('LogLeave')!,
      [ACCOUNT, pendingWithdrawal.shares, pendingWithdrawal.unlocksAt, pendingWithdrawal.maxTokens]
    )
    const otherEvent = walletStakingInterface.encodeEventLog(
      walletStakingInterface.getEvent('LogLeave')!,
      [
        OTHER_ACCOUNT,
        pendingWithdrawal.shares,
        pendingWithdrawal.unlocksAt,
        pendingWithdrawal.maxTokens
      ]
    )
    const unrelatedInterface = new Interface(['event Transfer(address indexed from)'])
    const unrelatedEvent = unrelatedInterface.encodeEventLog(
      unrelatedInterface.getEvent('Transfer')!,
      [ACCOUNT]
    )

    expect(
      decodePendingWalletWithdrawals(
        [
          { topics: event.topics, data: event.data },
          { topics: otherEvent.topics, data: otherEvent.data },
          { topics: unrelatedEvent.topics, data: unrelatedEvent.data }
        ],
        ACCOUNT
      )
    ).toEqual([pendingWithdrawal])
  })

  test('validates the relayer response before decoding logs', () => {
    const logs = [{ topics: [LOG_LEAVE_TOPIC], data: '0x' }]

    expect(parseWalletStakingRelayerLogsResponse({ success: true, data: { logs } })).toEqual(logs)
    expect(() =>
      parseWalletStakingRelayerLogsResponse({ success: false, message: 'Unavailable' })
    ).toThrow('Unavailable')
    expect(() =>
      parseWalletStakingRelayerLogsResponse({ success: true, data: { logs: [{}] } })
    ).toThrow('invalid pending withdrawal data')
  })

  test('calculates the contract commitment key deterministically', () => {
    const uppercaseAccount = `0x${ACCOUNT.slice(2).toUpperCase()}`

    expect(getPendingWalletWithdrawalCommitmentId(ACCOUNT, pendingWithdrawal)).toBe(
      getPendingWalletWithdrawalCommitmentId(uppercaseAccount, pendingWithdrawal)
    )
  })

  test('formats the countdown and only becomes ready after unlocksAt', () => {
    const unlocksAt = 2_592_000n

    expect(formatPendingWalletWithdrawalDuration(unlocksAt, 0)).toBe('30d 0h 0m')
    expect(isPendingWalletWithdrawalReady(unlocksAt, Number(unlocksAt) * 1000)).toBe(false)
    expect(isPendingWalletWithdrawalReady(unlocksAt, (Number(unlocksAt) + 1) * 1000)).toBe(true)
    expect(LOG_LEAVE_TOPIC).toMatch(/^0x/)
  })
})
