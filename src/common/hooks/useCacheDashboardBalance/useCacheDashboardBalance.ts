import { useEffect, useRef } from 'react'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'
import useControllerState from '@common/hooks/useControllerState'
import { isBalanceMaybeInaccurate } from '@common/modules/dashboard/helpers/balanceWarnings'
import {
  CACHE_REFRESH_INTERVAL_MS,
  setCachedDashboardBalance
} from '@common/modules/dashboard/helpers/dashboardBalanceCache'

type SelectedAccountState = AllControllersMappingType['SelectedAccountController']
type NetworksState = AllControllersMappingType['NetworksController']

// One selector per field on purpose. A selector that builds an object would return a new
// reference on every getSnapshot call, which defeats the subscription's identity check.
const selectAccount = (state: SelectedAccountState) => state.account
const selectPortfolio = (state: SelectedAccountState) => state.portfolio
const selectBalanceAffectingErrors = (state: SelectedAccountState) => state.balanceAffectingErrors
const selectAllNetworks = (state: NetworksState) => state.allNetworks
const selectAreNetworksFetchingFromRelayer = (state: NetworksState) =>
  state.areNetworksFetchingFromRelayer
const selectIsOffline = (state: AllControllersMappingType['MainController']) => state.isOffline

/**
 * Persists the last-known total balance of the selected account, so DashboardShell can
 * show it (pulsing) on the next open instead of a bare skeleton. Runs on every platform
 * that renders the shell and has to be mounted once, next to the other controller
 * helpers.
 */
export default function useCacheDashboardBalance() {
  const { state: account } = useControllerState({
    id: 'SelectedAccountController',
    selector: selectAccount
  })
  const { state: portfolio } = useControllerState({
    id: 'SelectedAccountController',
    selector: selectPortfolio
  })
  const { state: balanceAffectingErrors } = useControllerState({
    id: 'SelectedAccountController',
    selector: selectBalanceAffectingErrors
  })
  const { state: allNetworks } = useControllerState({
    id: 'NetworksController',
    selector: selectAllNetworks
  })
  const { state: areNetworksFetchingFromRelayer } = useControllerState({
    id: 'NetworksController',
    selector: selectAreNetworksFetchingFromRelayer
  })
  const { state: isOffline } = useControllerState({
    id: 'MainController',
    selector: selectIsOffline
  })
  const lastCacheSignatureRef = useRef<string | null>(null)
  const lastCacheAttemptAtRef = useRef(0)

  useEffect(() => {
    const addr = account?.addr

    if (!addr || !portfolio?.isReadyToVisualize) return

    // Same predicate the dashboard uses to color the balance. Persisted so the shell
    // shows a skeleton instead of the cached value when the balance may be inaccurate
    // (see isBalanceMaybeInaccurate for why).
    const hasBalanceAffectingErrors = isBalanceMaybeInaccurate({
      balanceAffectingErrors: balanceAffectingErrors ?? [],
      verification: portfolio.verification,
      allNetworks: allNetworks ?? [],
      areNetworksFetchingFromRelayer: !!areNetworksFetchingFromRelayer,
      isOffline: !!isOffline
    })

    const totalBalance = portfolio.totalBalance || 0

    // In-memory fast path so a portfolio tick that changes nothing doesn't even read
    // storage. It can only skip what the cache helper would skip anyway - the helper
    // owns the refresh interval, because these refs are gone on the next popup open.
    const now = Date.now()
    const signature = `${addr.toLowerCase()}:${totalBalance}:${hasBalanceAffectingErrors}`
    const isUnchanged = lastCacheSignatureRef.current === signature

    if (isUnchanged && now - lastCacheAttemptAtRef.current < CACHE_REFRESH_INTERVAL_MS) return

    lastCacheSignatureRef.current = signature
    lastCacheAttemptAtRef.current = now

    setCachedDashboardBalance({ addr, totalBalance, hasBalanceAffectingErrors }, now)
  }, [
    account,
    portfolio,
    balanceAffectingErrors,
    allNetworks,
    areNetworksFetchingFromRelayer,
    isOffline
  ])
}
