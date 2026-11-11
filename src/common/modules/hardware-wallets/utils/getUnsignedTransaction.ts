import { TransactionLike } from 'ethers'

import { TxnRequest } from '@ambire-common/interfaces/keystore'

/**
 * The unsigned transaction a hardware wallet signs for a transaction request.
 * Shared by the signers and the signing verification details, so the
 * transaction hash shown to the user is always built the same way as what the
 * device signs.
 */
export const getUnsignedTransaction = (
  txnRequest: TxnRequest
): TransactionLike & { type: number } => ({
  ...txnRequest,
  // In case `maxFeePerGas` is provided, treat as an EIP-1559 transaction,
  // since there's no other better way to distinguish between the two in here.
  type: typeof txnRequest.maxFeePerGas === 'bigint' ? 2 : 0
})
