import { ZeroAddress } from 'ethers'

import { SubmittedAccountOp } from '@ambire-common/libs/accountOp/submittedAccountOp'
import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'
import { BROADCAST_OPTIONS } from '@ambire-common/libs/broadcast/broadcast'

import {
  canBuildReplacementAccountOp,
  getResendAccountOp,
  getSafeCancellationAccountOp,
  getSpeedUpAccountOp,
  isSentThroughBundler
} from './replacementAccountOps'

const SAFE = '0x714fD8A33a8eE16F7Fc39B3A1C4D9f3b7a7dDe5c'
const OWNER = '0x77777777789A8BBEE6C64381e5E89E501fb0e4c8'

const buildPendingAccountOp = (broadcastOption: string): SubmittedAccountOp => ({
  id: 'pending-op',
  accountAddr: SAFE,
  chainId: 1n,
  signingKeyAddr: OWNER,
  signingKeyType: 'internal',
  nonce: 268n,
  calls: [{ id: 'call', to: OWNER, value: 1n, data: '0x' }],
  gasLimit: 100000,
  signature: '0xsafe-signatures',
  signed: [OWNER],
  txnId: '0xsafe-txn-hash',
  status: AccountOpStatus.BroadcastedButNotConfirmed,
  gasFeePayment: {
    paidBy: SAFE,
    paidByKeyType: 'internal',
    broadcastOption,
    isGasTank: true,
    inToken: ZeroAddress,
    feeTokenChainId: 1n,
    amount: 1000n,
    simulatedGasLimit: 100000n,
    gasPrice: 100n,
    maxPriorityFeePerGas: 10n
  },
  // only its presence matters here
  asUserOperation: { nonce: '0x01' } as unknown as SubmittedAccountOp['asUserOperation'],
  meta: { speedUp: { enabled: true } },
  identifiedBy: { type: 'UserOperation', identifier: '0xuserophash' },
  timestamp: Date.now()
})

describe('replacementAccountOps', () => {
  test('tells transactions sent through a bundler apart from the rest', () => {
    expect(isSentThroughBundler(buildPendingAccountOp(BROADCAST_OPTIONS.byBundler))).toBe(true)
    expect(isSentThroughBundler(buildPendingAccountOp(BROADCAST_OPTIONS.byOtherEOA))).toBe(false)
  })

  test('resends the same Safe transaction, already signed by the owners', () => {
    const pending = buildPendingAccountOp(BROADCAST_OPTIONS.byBundler)
    const resend = getResendAccountOp(pending)

    expect(resend.calls).toBe(pending.calls)
    expect(resend.nonce).toBe(268n)
    expect(resend.signature).toBe(pending.signature)
    expect(resend.signed).toBe(pending.signed)
    // the stored txnId isn't the hash the owners signed, so it must not be used to recover them
    expect(resend.txnId).toBeUndefined()
  })

  test('resends as a regular request, with the fee and the way of sending picked again', () => {
    const pending = buildPendingAccountOp(BROADCAST_OPTIONS.byBundler)
    const resend = getResendAccountOp(pending)

    expect(resend.id).not.toBe(pending.id)
    expect(resend.meta?.speedUp).toBeUndefined()
    expect(resend.gasFeePayment).toBeNull()
    expect(resend.gasLimit).toBeNull()
    expect(resend.eoaNonce).toBeUndefined()
    expect(resend.asUserOperation).toBeUndefined()
    expect(resend.status).toBeUndefined()
  })

  test('marks every speed up as a resend, so it stays out of the Safe queue', () => {
    expect(getResendAccountOp(buildPendingAccountOp(BROADCAST_OPTIONS.byBundler)).meta).toEqual({
      isResend: true
    })

    const sentByEoa = buildPendingAccountOp(BROADCAST_OPTIONS.byOtherEOA)
    if (!canBuildReplacementAccountOp(sentByEoa)) throw new Error('Expected a replaceable op')
    expect(getSpeedUpAccountOp(sentByEoa).meta?.isResend).toBe(true)
  })

  test('speeds up without the stored txnId, as it is not the hash the owners signed', () => {
    const sentByEoa = buildPendingAccountOp(BROADCAST_OPTIONS.byOtherEOA)
    if (!canBuildReplacementAccountOp(sentByEoa)) throw new Error('Expected a replaceable op')
    const speedUp = getSpeedUpAccountOp(sentByEoa)

    expect(speedUp.txnId).toBeUndefined()
    // a fresh id, so Activity doesn't overwrite the transaction it speeds up
    expect(speedUp.id).not.toBe(sentByEoa.id)
    expect(speedUp.signature).toBe(sentByEoa.signature)
    expect(speedUp.signed).toBe(sentByEoa.signed)
    expect(speedUp.nonce).toBe(268n)
  })

  test('cancels with an empty Safe transaction at the same nonce, as a regular request', () => {
    const pending = buildPendingAccountOp(BROADCAST_OPTIONS.byOtherEOA)
    const cancellation = getSafeCancellationAccountOp(pending)

    expect(cancellation.nonce).toBe(268n)
    expect(cancellation.calls).toHaveLength(1)
    expect(cancellation.calls[0]).toMatchObject({ to: ZeroAddress, value: 0n, data: '0x' })
    expect(cancellation.signature).toBeNull()
    expect(cancellation.meta).toBeUndefined()
    // picked from scratch, so the payer and its nonce are never forced on another sender
    expect(cancellation.gasFeePayment).toBeNull()
    expect(cancellation.eoaNonce).toBeUndefined()
  })
})
