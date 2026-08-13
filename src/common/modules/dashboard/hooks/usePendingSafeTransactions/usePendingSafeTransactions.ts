import { useMemo } from 'react'

import useController from '@common/hooks/useController'

import {
  getSafeQueueNetworkGroups,
  getSafeQueueRequests,
  SafeQueueNetworkGroup
} from '../../components/SafeQueueBottomSheet/helpers'

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
