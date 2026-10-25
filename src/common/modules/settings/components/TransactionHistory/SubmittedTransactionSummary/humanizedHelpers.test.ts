import { ZeroAddress } from 'ethers'

import { jest } from '@jest/globals'

import { BROADCAST_OPTIONS } from '@ambire-common/libs/broadcast/broadcast'

import type { SubmittedAccountOpLike } from '@ambire-common/libs/accountOp/submittedAccountOp'

import { getDappInteractionsFromHumanizedCalls, getHumanizedCalls } from './humanizedHelpers'

// The hooks wrap this pure helper; testing it directly keeps these cases free of React/controllers.
const getDappInteractions = (submittedAccountOp: SubmittedAccountOpLike) =>
  getDappInteractionsFromHumanizedCalls(submittedAccountOp, getHumanizedCalls(submittedAccountOp))

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
    const interactions = getDappInteractions(buildSubmittedAccountOp())

    expect(interactions).toEqual([
      {
        id: 'fallback:cancel',
        name: 'Cancel',
        iconType: 'safe',
        nonce: 7n
      }
    ])
  })

  test('preserves nonce zero in the cancellation description', () => {
    const interactions = getDappInteractions(buildSubmittedAccountOp({ nonce: 0n }))

    expect(interactions[0]?.nonce).toBe(0n)
  })

  test.each([
    [true, 'fallback:delegation', 'Enable smart settings'],
    [false, 'fallback:revoke', 'Revoke delegation']
  ])(
    'does not treat an EIP-7702 delegation change (setDelegation: %s) as a cancellation',
    (setDelegation, id, name) => {
      const interactions = getDappInteractions(buildSubmittedAccountOp({ meta: { setDelegation } }))

      expect(interactions).toEqual([{ id, name, iconType: 'ambire' }])
    }
  )

  test('treats a call that carries a value as a regular send, not a cancellation', () => {
    const interactions = getDappInteractions(
      buildSubmittedAccountOp({ calls: [{ to: ZeroAddress, value: 1n, data: '0x' }] })
    )

    expect(interactions[0]).toMatchObject({
      id: 'fallback:send',
      name: 'Send',
      iconType: 'send'
    })
  })
})

describe('getDappInteractions cancel of a pending transaction', () => {
  const feePaidWith = (broadcastOption: string): SubmittedAccountOpLike['gasFeePayment'] => ({
    isGasTank: false,
    paidBy: '0x714fD3Db837e72bD49B8edA02B8f4D53DfdDe5ce',
    paidByKeyType: 'internal',
    inToken: ZeroAddress,
    amount: 1n,
    simulatedGasLimit: 21000n,
    gasPrice: 1n,
    broadcastOption
  })

  test('a 7702 EOA cancel shows its transaction count, not its smart account nonce', () => {
    const interactions = getDappInteractions(
      buildSubmittedAccountOp({
        nonce: 0n,
        eoaNonce: 12n,
        gasFeePayment: feePaidWith(BROADCAST_OPTIONS.bySelf7702),
        meta: { speedUp: { enabled: true, isCancel: true, replacedNonce: 0n } }
      })
    )

    expect(interactions).toEqual([
      { id: 'fallback:cancel', name: 'Cancel', iconType: 'ambire', nonce: 12n }
    ])
  })

  test('a smart account cancel shows the smart account nonce it signed', () => {
    const interactions = getDappInteractions(
      buildSubmittedAccountOp({
        nonce: 6n,
        eoaNonce: 40n,
        gasFeePayment: feePaidWith(BROADCAST_OPTIONS.byOtherEOA),
        meta: { speedUp: { enabled: true, isCancel: true, replacedNonce: 5n } }
      })
    )

    expect(interactions).toEqual([
      { id: 'fallback:cancel', name: 'Cancel', iconType: 'ambire', nonce: 5n }
    ])
  })

  test('a Safe cancel signed by its owners keeps the Safe icon', () => {
    const interactions = getDappInteractions(
      buildSubmittedAccountOp({
        nonce: 3n,
        signed: ['0x714fD3Db837e72bD49B8edA02B8f4D53DfdDe5ce'],
        gasFeePayment: feePaidWith(BROADCAST_OPTIONS.byOtherEOA),
        meta: { speedUp: { enabled: true, isCancel: true, replacedNonce: 3n } }
      })
    )

    expect(interactions).toEqual([
      { id: 'fallback:cancel', name: 'Cancel', iconType: 'safe', nonce: 3n }
    ])
  })

  test('a cancel without a known nonce shows no nonce', () => {
    const interactions = getDappInteractions(
      buildSubmittedAccountOp({
        eoaNonce: undefined,
        gasFeePayment: feePaidWith(BROADCAST_OPTIONS.bySelf),
        meta: { speedUp: { enabled: true, isCancel: true } }
      })
    )

    expect(interactions).toEqual([{ id: 'fallback:cancel', name: 'Cancel', iconType: 'ambire' }])
  })
})

describe('getDappInteractions Safe deployment', () => {
  test('shows a Safe deployment with the Safe account icon', () => {
    const interactions = getDappInteractions(
      buildSubmittedAccountOp({ meta: { isSafeDeploy: true } })
    )

    expect(interactions).toEqual([
      {
        id: 'fallback:safeDeploy',
        name: 'Activate Safe account',
        iconType: 'safe'
      }
    ])
  })
})
