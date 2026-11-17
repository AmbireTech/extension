import { maxUint256 } from 'viem'

import { getAccountOpNonce } from '@ambire-common/libs/accountOp/accountOp'

import type { UserRequest } from '@ambire-common/interfaces/userRequest'

const isValidSafeNonce = (value: string, latestNonce?: bigint) => {
  if (!value || value.includes('.')) return false

  try {
    const nonce = BigInt(value)
    return nonce >= (latestNonce ?? 0n) && nonce <= maxUint256
  } catch {
    return false
  }
}

const getQueuedSafeNonces = (
  userRequests: UserRequest[],
  currentRequestId: UserRequest['id'] | undefined,
  accountAddr: string,
  chainId: bigint
) =>
  userRequests.reduce<bigint[]>((nonces, request) => {
    if (
      request.kind !== 'calls' ||
      request.id === currentRequestId ||
      !!request.meta?.isSafeDeploy ||
      !request.signAccountOp.account.safeCreation ||
      request.signAccountOp.accountOp.accountAddr !== accountAddr ||
      request.signAccountOp.accountOp.chainId !== chainId
    )
      return nonces

    const requestNonce = getAccountOpNonce(request.signAccountOp.accountOp)
    if (requestNonce !== null) nonces.push(requestNonce)
    return nonces
  }, [])

export { getQueuedSafeNonces, isValidSafeNonce }
