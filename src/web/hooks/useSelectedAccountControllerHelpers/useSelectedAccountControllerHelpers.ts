import { useEffect, useRef } from 'react'

import { setExtraContext } from '@common/config/analytics/CrashAnalytics'
import useControllerState from '@common/hooks/useControllerState'
import { isBalanceMaybeInaccurate } from '@common/modules/dashboard/helpers/balanceWarnings'
import {
  CACHE_REFRESH_INTERVAL_MS,
  setCachedDashboardBalance
} from '@web/modules/dashboard/helpers/dashboardBalanceCache'

export default function useSelectedAccountControllerHelpers() {
  const { state } = useControllerState({ id: 'SelectedAccountController' })
  const { state: networksState } = useControllerState({ id: 'NetworksController' })
  const { state: mainState } = useControllerState({ id: 'MainController' })
  const lastCacheSignatureRef = useRef<string | null>(null)
  const lastCacheAttemptAtRef = useRef(0)

  useEffect(() => {
    if (!state.account?.addr) return

    setExtraContext('address', state.account.addr)
  }, [state.account?.addr])

  // Persist the last-known total balance per account so the shell can show it (pulsing)
  // on the next open instead of a bare skeleton. Only once the portfolio is ready.
  useEffect(() => {
    const addr = state.account?.addr
    const portfolio = state.portfolio

    if (!addr || !portfolio?.isReadyToVisualize) return

    // Same predicate the dashboard uses to color the balance. Persisted so the shell
    // shows a skeleton instead of the cached value when the balance may be inaccurate
    // (see isBalanceMaybeInaccurate for why).
    const hasBalanceAffectingErrors = isBalanceMaybeInaccurate({
      balanceAffectingErrors: state.balanceAffectingErrors ?? [],
      verification: portfolio.verification,
      allNetworks: networksState.allNetworks ?? [],
      areNetworksFetchingFromRelayer: !!networksState.areNetworksFetchingFromRelayer,
      isOffline: !!mainState.isOffline
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
    state.account,
    state.portfolio,
    state.balanceAffectingErrors,
    networksState.allNetworks,
    networksState.areNetworksFetchingFromRelayer,
    mainState.isOffline
  ])
}
