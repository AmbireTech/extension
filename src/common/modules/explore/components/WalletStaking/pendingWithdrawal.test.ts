import { Interface } from 'ethers'

import {
  decodePendingWalletWithdrawals,
  formatPendingWalletWithdrawalDuration,
  getPendingWalletWithdrawalCommitmentId,
  getPendingWalletWithdrawalStorageKey,
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
  test('uses the lock-time flow only for xWALLET balances of at least 0.01', () => {
    expect(shouldUsePendingWalletWithdrawalMode(pendingWithdrawal, 10n ** 16n - 1n)).toBe(false)
    expect(shouldUsePendingWalletWithdrawalMode(pendingWithdrawal, 10n ** 16n)).toBe(true)
    expect(shouldUsePendingWalletWithdrawalMode(null, 10n ** 16n)).toBe(false)
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
