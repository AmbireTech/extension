import { getQueuedSafeNonces, isValidSafeNonce } from './helpers'

import type { UserRequest } from '@ambire-common/interfaces/userRequest'

describe('isValidSafeNonce', () => {
  test('accepts a nonce equal to or greater than the latest chain nonce', () => {
    expect(isValidSafeNonce('10', 10n)).toBe(true)
    expect(isValidSafeNonce('11', 10n)).toBe(true)
  })

  test('rejects a nonce lower than the latest chain nonce', () => {
    expect(isValidSafeNonce('9', 10n)).toBe(false)
  })

  test('validates the uint256 range when the latest chain nonce is unavailable', () => {
    expect(isValidSafeNonce('0')).toBe(true)
    expect(isValidSafeNonce('-1')).toBe(false)
    expect(isValidSafeNonce((1n << 256n).toString())).toBe(false)
  })

  test('rejects empty, decimal, and non-numeric values', () => {
    expect(isValidSafeNonce('')).toBe(false)
    expect(isValidSafeNonce('1.5')).toBe(false)
    expect(isValidSafeNonce('nonce')).toBe(false)
  })
})

describe('getQueuedSafeNonces', () => {
  const accountAddr = '0x77777777789A8BBEE6C64381e5E89E501fb0e4c8'
  const getSafeRequest = (id: string, nonce: bigint, isSafeDeploy = false): UserRequest =>
    ({
      id,
      kind: 'calls',
      meta: { accountAddr, chainId: 1n, isSafeDeploy },
      signAccountOp: {
        account: { safeCreation: {} },
        accountOp: { accountAddr, chainId: 1n, nonce }
      }
    }) as unknown as UserRequest

  test('does not treat a Safe deployment as using a Safe nonce', () => {
    const currentRequest = getSafeRequest('action', 0n)
    const deployRequest = getSafeRequest('deploy', 0n, true)

    expect(
      getQueuedSafeNonces([deployRequest, currentRequest], currentRequest.id, accountAddr, 1n)
    ).toEqual([])
  })

  test('keeps tracking nonce usage by regular queued Safe requests', () => {
    const currentRequest = getSafeRequest('action', 0n)
    const pendingRequest = getSafeRequest('pending', 1n)

    expect(
      getQueuedSafeNonces([pendingRequest, currentRequest], currentRequest.id, accountAddr, 1n)
    ).toEqual([1n])
  })
})
