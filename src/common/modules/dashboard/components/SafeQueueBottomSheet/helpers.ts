import type { Network } from '@ambire-common/interfaces/network'

import type { CallsUserRequest, UserRequest } from '@ambire-common/interfaces/userRequest'

export type SafeQueueStatus = 'needs-signature' | 'waiting' | 'ready' | 'rejected'

export type SafeQueueNonceGroup = {
  nonce: bigint
  requests: CallsUserRequest[]
}

export type SafeQueueNetworkGroup = {
  network: Network
  nonceGroups: SafeQueueNonceGroup[]
  requestsCount: number
}

export const getSafeQueueRequests = (
  userRequests: UserRequest[],
  accountAddr: string,
  currentNonces: Record<string, bigint | undefined>
) =>
  userRequests.filter((request): request is CallsUserRequest => {
    if (request.kind !== 'calls') return false

    const { accountOp, account } = request.signAccountOp
    if (!account.safeCreation || accountOp.accountAddr !== accountAddr || !accountOp.txnId)
      return false
    if (accountOp.nonce === null || accountOp.nonce === undefined) return false

    const currentNonce = currentNonces[accountOp.chainId.toString()]
    if (currentNonce !== undefined && accountOp.nonce < currentNonce) return false

    return true
  })

export const getSafeQueueStatus = (request: CallsUserRequest): SafeQueueStatus => {
  const { accountKeyStoreKeys, accountOp, threshold } = request.signAccountOp
  const signedOwners = new Set((accountOp.signed || []).map((addr) => addr.toLowerCase()))
  const hasImportedOwnerToSign = accountKeyStoreKeys.some(
    (key) => !signedOwners.has(key.addr.toLowerCase())
  )

  if (threshold > 0 && signedOwners.size >= threshold) return 'ready'
  if (hasImportedOwnerToSign) return 'needs-signature'
  return 'waiting'
}

export const getSafeQueueNetworkGroups = (
  requests: CallsUserRequest[],
  networks: Network[]
): SafeQueueNetworkGroup[] =>
  networks
    .map((network) => {
      const networkRequests = requests.filter(
        (request) => request.signAccountOp.accountOp.chainId === network.chainId
      )
      const requestsByNonce = new Map<string, CallsUserRequest[]>()

      networkRequests.forEach((request) => {
        const nonce = request.signAccountOp.accountOp.nonce!
        const key = nonce.toString()
        requestsByNonce.set(key, [...(requestsByNonce.get(key) || []), request])
      })

      const nonceGroups = [...requestsByNonce.entries()]
        .map(([nonce, nonceRequests]) => ({
          nonce: BigInt(nonce),
          requests: [...nonceRequests].sort((a, b) => {
            const aCreatedAt = Date.parse(a.signAccountOp.accountOp.safeTx?.submissionDate || '')
            const bCreatedAt = Date.parse(b.signAccountOp.accountOp.safeTx?.submissionDate || '')
            const aHasSubmissionDate = !Number.isNaN(aCreatedAt)
            const bHasSubmissionDate = !Number.isNaN(bCreatedAt)

            if (aHasSubmissionDate !== bHasSubmissionDate) return aHasSubmissionDate ? 1 : -1
            if (!aHasSubmissionDate) return 0

            return bCreatedAt - aCreatedAt
          })
        }))
        .sort((a, b) => (a.nonce < b.nonce ? -1 : a.nonce > b.nonce ? 1 : 0))

      return {
        network,
        nonceGroups,
        requestsCount: networkRequests.length
      }
    })
    .filter((group) => group.requestsCount > 0)
