import { useMemo } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { isSignRequest } from '@ambire-common/libs/requests/requests'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const CHAIN_NONCE_SEPARATOR = ':'

/**
 * The number of requests waiting for the account's signature, on all chains. For a Safe it
 * includes its queued transactions waiting for more owners, except those whose nonce has
 * already been used, like the Safe queue in the activity does.
 */
const usePendingRequestsCount = (account: Account): number => {
  const { addr, safeCreation } = account
  const isSafe = !!safeCreation
  // A string, compared by value, as the controller updates the state of each chain in place
  const selectSafeNoncesKey = useMemo(
    () => (state: AllControllersMappingType['AccountsController']) => {
      const accountState = isSafe ? state.accountStates[addr] : undefined
      if (!accountState) return ''

      return Object.keys(accountState)
        .map((chainId) => `${chainId}${CHAIN_NONCE_SEPARATOR}${accountState[chainId]!.nonce}`)
        .join()
    },
    [addr, isSafe]
  )
  const { state: safeNoncesKey } = useController('AccountsController', selectSafeNoncesKey)

  // A number, so that the rows re-render only when their own count changes
  const selectPendingRequestsCount = useMemo(() => {
    const currentSafeNonces = new Map(
      safeNoncesKey
        .split(',')
        .filter(Boolean)
        .map((chainNonce) => {
          const [chainId, nonce] = chainNonce.split(CHAIN_NONCE_SEPARATOR)
          return [chainId!, BigInt(nonce!)]
        })
    )

    return (state: AllControllersMappingType['RequestsController']) =>
      state.userRequests.filter((request) => {
        if (!isSignRequest(request.kind) || request.meta.pendingToRemove) return false
        if (request.meta.accountAddr !== addr) return false
        if (request.kind !== 'calls' || !request.signAccountOp.accountOp.txnId) return true

        const { chainId, nonce } = request.signAccountOp.accountOp
        const currentNonce = currentSafeNonces.get(chainId.toString())

        return currentNonce === undefined || nonce === null || nonce >= currentNonce
      }).length
  }, [addr, safeNoncesKey])
  const { state: pendingRequestsCount } = useController(
    'RequestsController',
    selectPendingRequestsCount
  )

  return pendingRequestsCount
}

export default usePendingRequestsCount
