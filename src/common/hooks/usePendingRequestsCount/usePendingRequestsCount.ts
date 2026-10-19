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

/** The current nonce of the selected Safe on each chain, as a string compared by value */
const getSafeNoncesKey = (
  accountState: Record<string, { nonce?: unknown } | undefined> | undefined
) =>
  Object.entries(accountState ?? {})
    .filter(([, chainState]) => typeof chainState?.nonce === 'bigint')
    .map(([chainId, chainState]) => `${chainId}${CHAIN_NONCE_SEPARATOR}${chainState!.nonce}`)
    .join()

// Built from bigints only, so every nonce in the key parses back
const parseSafeNoncesKey = (safeNoncesKey: string) =>
  new Map(
    safeNoncesKey
      .split(',')
      .filter(Boolean)
      .map((chainNonce) => {
        const [chainId, nonce] = chainNonce.split(CHAIN_NONCE_SEPARATOR)
        return [chainId!, BigInt(nonce!)]
      })
  )

/**
 * Whether the request waits for its account's signature, see `usePendingRequestsCount`.
 * `currentSafeNonces` are the selected Safe's, empty for any other account.
 */
const isPendingRequest = (
  request: UserRequest,
  {
    isOtherSafe,
    currentSafeNonces
  }: { isOtherSafe: boolean; currentSafeNonces: Map<string, bigint> }
) => {
  if (!request || !isSignRequest(request.kind)) return false
  if (!request.meta || request.meta.pendingToRemove) return false
  // Already in the Safe's fetched counts, which stay fresh while it is not selected
  if (isOtherSafe) return !isOnSafeServers(request)

  const accountOp = request.kind === 'calls' ? request.signAccountOp?.accountOp : undefined
  if (!accountOp?.txnId || typeof accountOp.nonce !== 'bigint') return true

  const currentNonce = currentSafeNonces.get(String(accountOp.chainId))

  return currentNonce === undefined || accountOp.nonce >= currentNonce
}

/** The Safe's txns and messages waiting for more owners, summed across its chains */
const sumSafeCounts = (safeCountByChainId: Record<string, number> | undefined) =>
  Object.values(safeCountByChainId ?? {}).reduce<number>(
    (total, count) => (Number.isFinite(count) ? total + count : total),
    0
  )

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

      return getSafeNoncesKey(accountState)
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
    const currentSafeNonces = parseSafeNoncesKey(safeNoncesKey || '')

    return (state: AllControllersMappingType['RequestsController']) => {
      const userRequests = state?.userRequests
      if (!Array.isArray(userRequests)) return 0

      return userRequests.filter(
        (request) =>
          request?.meta?.accountAddr === addr &&
          isPendingRequest(request, { isOtherSafe, currentSafeNonces })
      ).length
    }
  }, [addr, isOtherSafe, safeNoncesKey])
  const { state: requestsCount } = useController('RequestsController', selectRequestsCount)

  return useMemo(
    () => sumSafeCounts(safeCountByChainId) + (Number.isFinite(requestsCount) ? requestsCount : 0),
    [requestsCount, safeCountByChainId]
  )
}

/**
 * The accounts that `usePendingRequestsCount` gives a count above zero, worked out for the
 * whole list in one pass over the requests
 */
export const usePendingAccountAddrs = (accounts: Account[]): Set<Account['addr']> => {
  const { state: selectedAccountAddr } = useController(
    'SelectedAccountController',
    selectSelectedAccountAddr
  )
  const selectedSafeAddr = accounts.find(
    (account) => !!account.safeCreation && account.addr === selectedAccountAddr
  )?.addr
  const otherSafeAddrs = useMemo(
    () =>
      accounts
        .filter((account) => !!account.safeCreation && account.addr !== selectedAccountAddr)
        .map((account) => account.addr),
    [accounts, selectedAccountAddr]
  )

  const selectSafeNoncesKey = useMemo(
    () => (state: AllControllersMappingType['AccountsController']) =>
      selectedSafeAddr ? getSafeNoncesKey(state?.accountStates?.[selectedSafeAddr]) : '',
    [selectedSafeAddr]
  )
  const { state: safeNoncesKey } = useController('AccountsController', selectSafeNoncesKey)

  // Strings, compared by value, so that the list re-renders only when the accounts change
  const selectPendingOtherSafesKey = useMemo(
    () => (state: AllControllersMappingType['SafeController']) =>
      otherSafeAddrs.filter((addr) => sumSafeCounts(state?.pendingCountBySafe?.[addr]) > 0).join(),
    [otherSafeAddrs]
  )
  const { state: pendingOtherSafesKey } = useController(
    'SafeController',
    selectPendingOtherSafesKey
  )

  const selectPendingRequestsKey = useMemo(() => {
    const otherSafes = new Set(otherSafeAddrs)
    const selectedSafeNonces = parseSafeNoncesKey(safeNoncesKey || '')
    const noNonces = new Map<string, bigint>()

    return (state: AllControllersMappingType['RequestsController']) => {
      const userRequests = state?.userRequests
      if (!Array.isArray(userRequests)) return ''

      const addrs = new Set<string>()
      userRequests.forEach((request) => {
        const addr = request?.meta?.accountAddr
        if (!addr || addrs.has(addr)) return

        const isPending = isPendingRequest(request, {
          isOtherSafe: otherSafes.has(addr),
          currentSafeNonces: addr === selectedSafeAddr ? selectedSafeNonces : noNonces
        })
        if (isPending) addrs.add(addr)
      })

      return Array.from(addrs).sort().join()
    }
  }, [otherSafeAddrs, safeNoncesKey, selectedSafeAddr])
  const { state: pendingRequestsKey } = useController(
    'RequestsController',
    selectPendingRequestsKey
  )

  return useMemo(
    () =>
      new Set(
        `${pendingOtherSafesKey || ''},${pendingRequestsKey || ''}`.split(',').filter(Boolean)
      ),
    [pendingOtherSafesKey, pendingRequestsKey]
  )
}

export default usePendingRequestsCount
