import { useMemo } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { UserRequest } from '@ambire-common/interfaces/userRequest'
import { isSignRequest } from '@ambire-common/libs/requests/requests'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const CHAIN_NONCE_SEPARATOR = ':'

/*
 * The selectors read every field optionally, as the store hands them an empty object until
 * the controller's first state arrives, which on mobile is after the first screens render.
 */

const selectSelectedAccountAddr = (state: AllControllersMappingType['SelectedAccountController']) =>
  state?.account?.addr

/** Whether the request is a Safe txn or message that waits for more owners on Safe's servers */
const isOnSafeServers = (request: UserRequest) =>
  request.kind === 'calls' ? !!request.signAccountOp?.accountOp?.txnId : !!request.meta?.hash

/**
 * The number of requests waiting for the account's signature, on all chains. For a Safe it
 * includes its txns and messages waiting for more owners. The selected Safe's are its
 * requests, except the txns whose nonce has already been used, like the Safe queue in the
 * activity does. The other Safes' are the counts `SafeController` fetches for them.
 */
const usePendingRequestsCount = (account: Account): number => {
  const { addr, safeCreation } = account
  const isSafe = !!safeCreation
  const { state: selectedAccountAddr } = useController(
    'SelectedAccountController',
    selectSelectedAccountAddr
  )
  const isSelectedSafe = isSafe && addr === selectedAccountAddr
  const isOtherSafe = isSafe && !isSelectedSafe

  // A string, compared by value, as the controller updates the state of each chain in place
  const selectSafeNoncesKey = useMemo(
    () => (state: AllControllersMappingType['AccountsController']) => {
      const accountState = isSelectedSafe ? state?.accountStates?.[addr] : undefined
      if (!accountState) return ''

      return Object.entries(accountState)
        .filter(([, chainState]) => typeof chainState?.nonce === 'bigint')
        .map(([chainId, chainState]) => `${chainId}${CHAIN_NONCE_SEPARATOR}${chainState!.nonce}`)
        .join()
    },
    [addr, isSelectedSafe]
  )
  const { state: safeNoncesKey } = useController('AccountsController', selectSafeNoncesKey)

  const selectSafeCountByChainId = useMemo(
    () => (state: AllControllersMappingType['SafeController']) =>
      isOtherSafe ? state?.pendingCountBySafe?.[addr] : undefined,
    [addr, isOtherSafe]
  )
  const { state: safeCountByChainId } = useController('SafeController', selectSafeCountByChainId)

  // A number, so that the rows re-render only when their own count changes
  const selectRequestsCount = useMemo(() => {
    // Built from bigints only, so every nonce in the key parses back
    const currentSafeNonces = new Map(
      (safeNoncesKey || '')
        .split(',')
        .filter(Boolean)
        .map((chainNonce) => {
          const [chainId, nonce] = chainNonce.split(CHAIN_NONCE_SEPARATOR)
          return [chainId!, BigInt(nonce!)]
        })
    )

    return (state: AllControllersMappingType['RequestsController']) => {
      const userRequests = state?.userRequests
      if (!Array.isArray(userRequests)) return 0

      return userRequests.filter((request) => {
        if (!request || !isSignRequest(request.kind)) return false
        if (!request.meta || request.meta.pendingToRemove) return false
        if (request.meta.accountAddr !== addr) return false
        // Already in the Safe's fetched counts, which stay fresh while it is not selected
        if (isOtherSafe) return !isOnSafeServers(request)

        const accountOp = request.kind === 'calls' ? request.signAccountOp?.accountOp : undefined
        if (!accountOp?.txnId || typeof accountOp.nonce !== 'bigint') return true

        const currentNonce = currentSafeNonces.get(String(accountOp.chainId))

        return currentNonce === undefined || accountOp.nonce >= currentNonce
      }).length
    }
  }, [addr, isOtherSafe, safeNoncesKey])
  const { state: requestsCount } = useController('RequestsController', selectRequestsCount)

  return useMemo(
    () =>
      Object.values(safeCountByChainId ?? {}).reduce<number>(
        (total, count) => (Number.isFinite(count) ? total + count : total),
        Number.isFinite(requestsCount) ? requestsCount : 0
      ),
    [requestsCount, safeCountByChainId]
  )
}

export default usePendingRequestsCount
