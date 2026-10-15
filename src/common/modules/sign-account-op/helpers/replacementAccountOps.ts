import { ZeroAddress } from 'ethers'
import { v4 as uuidv4 } from 'uuid'

import { AccountOp, GasFeePayment } from '@ambire-common/libs/accountOp/accountOp'
import { SubmittedAccountOpLike } from '@ambire-common/libs/accountOp/submittedAccountOp'
import { BROADCAST_OPTIONS } from '@ambire-common/libs/broadcast/broadcast'

import type { BuildRequest } from '@ambire-common/interfaces/requests'

type ReplaceableSubmittedAccountOp = SubmittedAccountOpLike &
  Required<
    Pick<
      SubmittedAccountOpLike,
      'signingKeyAddr' | 'signingKeyType' | 'nonce' | 'gasLimit' | 'signature'
    >
  > & { gasFeePayment: GasFeePayment }

/**
 * Network nodes accept a replacement for a pending transaction only if it pays at least ~10%
 * more, so the fee is raised by 15% to stay safely above that threshold.
 */
const increaseByFifteenPercent = (value: bigint) => (value * 115n + 99n) / 100n

/**
 * Whether an already sent transaction has everything needed to be replaced (sped up or
 * cancelled) by a new transaction that reuses its nonce.
 */
export const canBuildReplacementAccountOp = (
  submittedAccountOp: SubmittedAccountOpLike
): submittedAccountOp is ReplaceableSubmittedAccountOp =>
  submittedAccountOp.signingKeyAddr !== undefined &&
  submittedAccountOp.signingKeyType !== undefined &&
  submittedAccountOp.nonce !== undefined &&
  submittedAccountOp.gasLimit !== undefined &&
  submittedAccountOp.signature !== undefined &&
  !!submittedAccountOp.gasFeePayment

/**
 * Whether a pending transaction can be sped up or cancelled from the wallet. Transactions sent
 * through the relayer or a bundler are excluded, as the wallet doesn't control their nonce.
 */
export const canReplacePendingAccountOp = (
  submittedAccountOp: SubmittedAccountOpLike
): submittedAccountOp is ReplaceableSubmittedAccountOp =>
  submittedAccountOp.gasFeePayment?.broadcastOption !== BROADCAST_OPTIONS.byRelayer &&
  submittedAccountOp.gasFeePayment?.broadcastOption !== BROADCAST_OPTIONS.byBundler &&
  canBuildReplacementAccountOp(submittedAccountOp)

const getIncreasedGasFeePayment = (gasFeePayment: GasFeePayment): GasFeePayment => ({
  ...gasFeePayment,
  gasPrice: increaseByFifteenPercent(gasFeePayment.gasPrice),
  maxPriorityFeePerGas:
    gasFeePayment.maxPriorityFeePerGas && gasFeePayment.maxPriorityFeePerGas !== 0n
      ? increaseByFifteenPercent(gasFeePayment.maxPriorityFeePerGas)
      : gasFeePayment.maxPriorityFeePerGas
})

/**
 * The same transaction as the pending one, with the same nonces and signatures, but paying a
 * higher fee so it replaces the pending one and gets confirmed sooner. The txnId is left out:
 * once sent, it's the network's transaction hash, not the Safe transaction hash the owners
 * signed, so it can't be used to tell who signed. `signed` already says that.
 */
export const getSpeedUpAccountOp = (
  submittedAccountOp: ReplaceableSubmittedAccountOp
): AccountOp => ({
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
  gasFeePayment: getIncreasedGasFeePayment(submittedAccountOp.gasFeePayment),
  asUserOperation: submittedAccountOp.asUserOperation,
  signers: submittedAccountOp.signers,
  signed: submittedAccountOp.signed,
  safeTx: submittedAccountOp.safeTx,
  flags: submittedAccountOp.flags,
  meta: {
    ...submittedAccountOp.meta,
    speedUp: {
      enabled: true
    },
    isResend: true
  }
})

/**
 * A Safe transaction that does nothing, with the pending transaction's Safe nonce. Once it's
 * confirmed instead of the pending one, the pending one can never go through. It's a regular
 * request: it needs fresh owner signatures, as its calls differ, and the fee and the payer are
 * picked like for any other transaction. When the same EOA that sent the pending transaction
 * pays, the EOA's nonce is the pending one's (it isn't confirmed yet), so the cancellation
 * replaces it while waiting, as long as its fee is high enough.
 */
export const getSafeCancellationAccountOp = (
  submittedAccountOp: SubmittedAccountOpLike
): AccountOp => ({
  id: uuidv4(),
  accountAddr: submittedAccountOp.accountAddr,
  chainId: submittedAccountOp.chainId,
  signingKeyAddr: submittedAccountOp.signingKeyAddr ?? null,
  signingKeyType: submittedAccountOp.signingKeyType ?? null,
  nonce: submittedAccountOp.nonce ?? null,
  calls: [{ id: uuidv4(), to: ZeroAddress, value: 0n, data: '0x' }],
  gasLimit: null,
  signature: null,
  gasFeePayment: null
})

/**
 * Whether the transaction was sent through a bundler. Such a transaction waits in the bundler's
 * own queue, under a nonce the wallet doesn't control, so it can't be replaced there.
 */
export const isSentThroughBundler = (submittedAccountOp: SubmittedAccountOpLike) =>
  submittedAccountOp.gasFeePayment?.broadcastOption === BROADCAST_OPTIONS.byBundler

/**
 * The same transaction as the pending one, opened as a regular request: same calls, same Safe
 * nonce and the owners' signatures, so nobody has to sign again, while the fee and the way of
 * sending are picked from scratch. Used to speed up a transaction sent through a bundler, as it
 * can't be replaced there - whichever of the two is confirmed first goes through.
 */
export const getResendAccountOp = (submittedAccountOp: SubmittedAccountOpLike): AccountOp => ({
  id: uuidv4(),
  accountAddr: submittedAccountOp.accountAddr,
  chainId: submittedAccountOp.chainId,
  signingKeyAddr: submittedAccountOp.signingKeyAddr ?? null,
  signingKeyType: submittedAccountOp.signingKeyType ?? null,
  nonce: submittedAccountOp.nonce ?? null,
  calls: submittedAccountOp.calls,
  gasLimit: null,
  signature: submittedAccountOp.signature ?? null,
  gasFeePayment: null,
  // Left out on purpose: once sent, the stored txnId is no longer the Safe transaction hash
  // the owners signed, so it can't be used to tell who signed. `signed` already says that
  signers: submittedAccountOp.signers,
  signed: submittedAccountOp.signed,
  safeTx: submittedAccountOp.safeTx,
  meta: { isResend: true }
})

/**
 * The request that opens the given replacement accountOp for signing, as its own request.
 */
export const getReplacementBuildRequest = (accountOp: AccountOp): BuildRequest => ({
  type: 'calls',
  params: {
    userRequestParams: {
      calls: accountOp.calls,
      meta: {
        chainId: accountOp.chainId,
        accountAddr: accountOp.accountAddr
      },
      accountOp
    }
  }
})
