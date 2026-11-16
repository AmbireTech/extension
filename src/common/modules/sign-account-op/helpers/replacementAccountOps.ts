import { ZeroAddress } from 'ethers'
import { v4 as uuidv4 } from 'uuid'

import { AccountOp } from '@ambire-common/libs/accountOp/accountOp'
import { SubmittedAccountOpLike } from '@ambire-common/libs/accountOp/submittedAccountOp'

import type { BuildRequest } from '@ambire-common/interfaces/requests'

/**
 * A Safe transaction that does nothing, with the pending transaction's Safe nonce. Once it's
 * confirmed instead of the pending one, the pending one can never go through. Used to cancel a
 * transaction that can't be replaced while waiting (see `getReplacementBlocker` in
 * ambire-common), e.g. one sent through a bundler; the rest are cancelled with
 * `getReplacementAccountOp`. It's a regular request: it needs fresh owner signatures, as its
 * calls differ, and the fee and the payer are picked like for any other transaction. When the same
 * EOA that sent the pending transaction pays, it still takes the next free EOA nonce, as the one
 * of the pending transaction is reserved, so the cancellation doesn't replace the pending
 * transaction in the mempool.
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
 * The same transaction as the pending one, opened as a regular request: same calls, same Safe
 * nonce and the owners' signatures, so nobody has to sign again, while the fee and the way of
 * sending are picked from scratch. Used to speed up a transaction that can't be replaced while
 * waiting (see `getReplacementBlocker` in ambire-common), e.g. one sent through a bundler, as it
 * can't be replaced there - whichever of the two is confirmed first goes through. The rest are
 * sped up with `getReplacementAccountOp`.
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
 * With `allowAccountSwitch`, a replacement of another account than the selected one waits behind
 * a request to switch to that account.
 */
export const getReplacementBuildRequest = (
  accountOp: AccountOp,
  allowAccountSwitch = false
): BuildRequest => ({
  type: 'calls',
  params: {
    userRequestParams: {
      calls: accountOp.calls,
      meta: {
        chainId: accountOp.chainId,
        accountAddr: accountOp.accountAddr
      },
      accountOp
    },
    allowAccountSwitch
  }
})
