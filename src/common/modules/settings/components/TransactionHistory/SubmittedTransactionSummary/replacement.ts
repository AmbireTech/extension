import { AccountOp } from '@ambire-common/libs/accountOp/accountOp'
import { isCancelAccountOp } from '@ambire-common/libs/accountOp/cancel'
import { AccountOpStatus } from '@ambire-common/libs/accountOp/types'
import { BROADCAST_OPTIONS } from '@ambire-common/libs/broadcast/broadcast'

import { SubmittedAccountOpLike } from './types'

/**
 * How a pending transaction gets replaced by a new one in its place (same nonces):
 * - `speedUp` sends the same calls again with a higher fee
 * - `cancel` sends empty calls instead (RequestsController swaps them in, see
 *   `toCancelAccountOp`), so the pending calls never run
 */
export type Replacement = 'speedUp' | 'cancel'

/**
 * Why a pending transaction can't be sped up or canceled, or null if it can.
 * The UI turns each one into a message for the user
 */
export type ReplacementBlocker =
  | 'external'
  | 'otherAccount'
  | 'notReplaceable'
  | 'missingDetails'
  | 'partiallyMined'

/**
 * A pending transaction can be sped up or canceled only if it was sent by a regular account
 * (the account itself, or another one of the user's accounts paying the fee). Only then can it
 * be replaced, by sending another transaction from the same account in its place. A transaction
 * sent by a relayer or a bundler is in their hands and can't be replaced
 */
const REPLACEABLE_BROADCAST_OPTIONS = [
  BROADCAST_OPTIONS.bySelf,
  BROADCAST_OPTIONS.bySelf7702,
  BROADCAST_OPTIONS.byOtherEOA,
  BROADCAST_OPTIONS.delegation
]

/**
 * Whether the transaction was sent in a way that can be replaced (see
 * `REPLACEABLE_BROADCAST_OPTIONS`). Only then does the activity offer Cancel and Speed up while
 * it's pending; otherwise it keeps its usual buttons
 */
export const isReplaceableBroadcast = (submittedAccountOp: SubmittedAccountOpLike): boolean => {
  const broadcastOption = submittedAccountOp.gasFeePayment?.broadcastOption

  return !!broadcastOption && REPLACEABLE_BROADCAST_OPTIONS.includes(broadcastOption)
}

type ReplaceableAccountOp = SubmittedAccountOpLike &
  Required<
    Pick<
      SubmittedAccountOpLike,
      'signingKeyAddr' | 'signingKeyType' | 'nonce' | 'gasLimit' | 'signature'
    >
  > & { gasFeePayment: NonNullable<SubmittedAccountOpLike['gasFeePayment']> }

/** Whether the submitted account op has everything needed to build its replacement */
export const canBuildReplacementAccountOp = (
  submittedAccountOp: SubmittedAccountOpLike
): submittedAccountOp is ReplaceableAccountOp =>
  !!submittedAccountOp.gasFeePayment &&
  submittedAccountOp.signingKeyAddr !== undefined &&
  submittedAccountOp.signingKeyType !== undefined &&
  submittedAccountOp.nonce !== undefined &&
  submittedAccountOp.gasLimit !== undefined &&
  submittedAccountOp.signature !== undefined

/** A batch sent as one transaction per call, with at least one call that is a failure / success */
export const isPartiallyMinedBatch = (submittedAccountOp: SubmittedAccountOpLike): boolean =>
  submittedAccountOp.identifiedBy.type === 'MultipleTxns' &&
  submittedAccountOp.calls.some(
    (c) => c.status === AccountOpStatus.Failure || c.status === AccountOpStatus.Success
  )

/**
 * Why the pending transaction can't be sped up or canceled, or null if it can
 *
 * @param isOwnTransaction whether it was sent by the selected account (and not received)
 */
export const getReplacementBlocker = (
  submittedAccountOp: SubmittedAccountOpLike,
  isOwnTransaction: boolean
): ReplacementBlocker | null => {
  if (submittedAccountOp.activitySource === 'external') return 'external'
  if (!isOwnTransaction) return 'otherAccount'

  if (!isReplaceableBroadcast(submittedAccountOp)) return 'notReplaceable'
  if (!canBuildReplacementAccountOp(submittedAccountOp)) return 'missingDetails'
  // A batch sent as one transaction per call is replaced from its first transaction on, so
  // once one of them went through, the replacement would be turned down
  if (isPartiallyMinedBatch(submittedAccountOp)) return 'partiallyMined'

  return null
}

/**
 * The account op that replaces the pending transaction, for RequestsController to build the
 * request from. It's the pending transaction as it was sent, marked as a speed up (or a cancel)
 * with what's needed to replace it: its fees, when it was first sent and how to find it.
 * Null if it lacks what's needed to build the replacement
 */
export const getReplacementAccountOp = (
  submittedAccountOp: SubmittedAccountOpLike,
  replacement: Replacement
): AccountOp | null => {
  if (!canBuildReplacementAccountOp(submittedAccountOp)) return null

  const { gasFeePayment } = submittedAccountOp
  // A pending cancel stays a cancel when sped up, as its calls are the empty ones
  const isCancel = replacement === 'cancel' || isCancelAccountOp(submittedAccountOp)

  return {
    // Only to fill the field: RequestsController gives every speed up an id of
    // its own, as the activity would overwrite the replaced op with a shared one
    id: submittedAccountOp.id,
    accountAddr: submittedAccountOp.accountAddr,
    chainId: submittedAccountOp.chainId,
    signingKeyAddr: submittedAccountOp.signingKeyAddr,
    signingKeyType: submittedAccountOp.signingKeyType,
    nonce: submittedAccountOp.nonce,
    eoaNonce: submittedAccountOp.eoaNonce,
    calls: submittedAccountOp.calls,
    feeCall: submittedAccountOp.feeCall,
    activatorCall: submittedAccountOp.activatorCall,
    gasLimit: submittedAccountOp.gasLimit,
    signature: submittedAccountOp.signature,
    gasFeePayment,
    txnId: submittedAccountOp.txnId,
    asUserOperation: submittedAccountOp.asUserOperation,
    signers: submittedAccountOp.signers,
    signed: submittedAccountOp.signed,
    safeTx: submittedAccountOp.safeTx,
    flags: submittedAccountOp.flags,
    meta: {
      ...submittedAccountOp.meta,
      speedUp: {
        enabled: true,
        replacedFees: {
          gasPrice: gasFeePayment.gasPrice,
          maxPriorityFeePerGas: gasFeePayment.maxPriorityFeePerGas,
          amount: gasFeePayment.amount
        },
        // A speed up of a speed up keeps the time of the very first attempt
        replacedSentAt:
          submittedAccountOp.meta?.speedUp?.replacedSentAt ?? submittedAccountOp.timestamp,
        replacedIdentifiedBy: submittedAccountOp.identifiedBy,
        // The account nonce the pending transaction was signed with. A speed up of a smart
        // account is stored with the next nonce (see RequestsController), so the first one is
        // carried over, for a cancel to sign with
        replacedNonce: submittedAccountOp.meta?.speedUp?.replacedNonce ?? submittedAccountOp.nonce,
        ...(isCancel && { isCancel })
      }
    }
  }
}
