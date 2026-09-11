import { useMemo } from 'react'

import useController from '@common/hooks/useController'

import type { Network } from '@ambire-common/interfaces/network'

import type { CallsUserRequest, UserRequest } from '@ambire-common/interfaces/userRequest'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.account
const selectDashboardNetworkFilter = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.dashboardNetworkFilter
const selectAccountStates = (state: AllControllersMappingType['AccountsController']) =>
  state.accountStates
const selectUserRequests = (state: AllControllersMappingType['RequestsController']) =>
  state.userRequests
const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

interface PendingSafeTransactions {
  /** Pending transactions of the selected Safe account, grouped by chain and then by nonce.
   * Limited to the chain selected in the dashboard network filter, if there is one. */
  networkGroups: SafeQueueNetworkGroup[]
  /** The number of pending transactions on all chains, regardless of the network filter. */
  totalPendingCount: number
  /** The nonce that executes next, per chain id. Undefined for chains whose account state
   * has not loaded, yet. */
  currentNonces: Record<string, bigint | undefined>
}

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

const getSafeQueueRequests = (
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

const getSafeQueueNetworkGroups = (
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

/**
 * Collects the pending transactions of the selected account. The values are empty for
 * accounts that are not Safe accounts.
 */
const usePendingSafeTransactions = (): PendingSafeTransactions => {
  const { state: account } = useController('SelectedAccountController', selectAccount)
  const { state: dashboardNetworkFilter } = useController(
    'SelectedAccountController',
    selectDashboardNetworkFilter
  )
  const { state: accountStates } = useController('AccountsController', selectAccountStates)
  const { state: userRequests } = useController('RequestsController', selectUserRequests)
  const { state: networks } = useController('NetworksController', selectNetworks)

  const currentNonces = useMemo(() => {
    if (!account) return {}

    return Object.fromEntries(
      Object.entries(accountStates[account.addr] || {}).map(([chainId, state]) => [
        chainId,
        state?.nonce
      ])
    )
  }, [account, accountStates])

  const requests = useMemo(
    () =>
      account?.safeCreation && userRequests
        ? getSafeQueueRequests(userRequests, account.addr, currentNonces)
        : [],
    [account, currentNonces, userRequests]
  )

  const filteredNetworks = useMemo(
    () =>
      dashboardNetworkFilter
        ? networks.filter((network) => network.chainId === BigInt(dashboardNetworkFilter))
        : networks,
    [dashboardNetworkFilter, networks]
  )

  const networkGroups = useMemo(
    () => getSafeQueueNetworkGroups(requests, filteredNetworks),
    [filteredNetworks, requests]
  )

  return useMemo(
    () => ({ networkGroups, totalPendingCount: requests.length, currentNonces }),
    [networkGroups, requests.length, currentNonces]
  )
}

export default usePendingSafeTransactions
