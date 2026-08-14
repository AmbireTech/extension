import { ZeroAddress } from 'ethers'

import { jest } from '@jest/globals'

import { SubmittedAccountOpLike } from '@ambire-common/libs/accountOp/submittedAccountOp'

import { getDappInteractions } from './humanizedHelpers'

jest.mock('@ambire-common/libs/humanizer', () => ({ humanizeAccountOp: () => [] }))

const buildSubmittedAccountOp = (
  overrides: Partial<SubmittedAccountOpLike> = {}
): SubmittedAccountOpLike => ({
  id: 'submitted-account-op',
  accountAddr: '0x714fD3Db837e72bD49B8edA02B8f4D53DfdDe5ce',
  chainId: 1n,
  calls: [{ to: ZeroAddress, value: 0n, data: '0x' }],
  gasFeePayment: null,
  nonce: 7n,
  timestamp: 0,
  identifiedBy: { type: 'Transaction', identifier: '0xtransaction' },
  ...overrides
})

describe('getDappInteractions Safe cancellation', () => {
  test('shows a Safe cancellation with its nonce', () => {
    const interactions = getDappInteractions(
      buildSubmittedAccountOp({ meta: { isOnchainSafeRejection: true } })
    )

    expect(interactions).toEqual([
      {
        id: 'fallback:cancel',
        name: 'Cancel',
        iconType: 'safe',
        safeNonce: 7n
      }
    ])
  })

  test('preserves nonce zero in the cancellation description', () => {
    const interactions = getDappInteractions(
      buildSubmittedAccountOp({ nonce: 0n, meta: { isOnchainSafeRejection: true } })
    )

    expect(interactions[0]?.safeNonce).toBe(0n)
  })

  test('keeps an unmarked empty zero-address call as a regular send', () => {
    const interactions = getDappInteractions(buildSubmittedAccountOp())

    expect(interactions[0]).toMatchObject({
      id: 'fallback:send',
      name: 'Send',
      iconType: 'send'
    })
  })
})
