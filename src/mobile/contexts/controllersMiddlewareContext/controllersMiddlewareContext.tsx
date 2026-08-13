import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react'

import { LIFI_EXPLORER_URL } from '@ambire-common/services/lifi/consts'
import { APP_VERSION } from '@common/config/env'
import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext'
import { ControllerStoreContext } from '@common/contexts/controllerStoreContext'
import useCacheDashboardBalance from '@common/hooks/useCacheDashboardBalance'
import useControllerState from '@common/hooks/useControllerState'
import useIsAppFocused from '@common/hooks/useIsAppFocused'
import useRoute from '@common/hooks/useRoute'
import { ROUTES } from '@common/modules/router/constants/common'
import { Action, MethodAction } from '@common/types/actions'
import { BUNGEE_API_KEY, RELAYER_URL, SQUID_INTEGRATOR_ID, UNISWAP_API_KEY, VELCRO_URL } from '@env'
import {
  MOBILE_CRITICAL_CONTROLLERS,
  MOBILE_DEFERRED_CONTROLLERS
} from '@mobile/constants/criticalControllers'
import useBootProfileReport from '@mobile/hooks/useBootProfileReport'
import useDappsControllerHelpers from '@mobile/hooks/useDappsControllerHelpers'
import useRequestsControllerHelpers from '@mobile/hooks/useRequestsControllerHelpers'
import { WebViewWorker, WebViewWorkerRef } from '@mobile/modules/webview/services/WebViewWorker'
import { dispatchToControllers, initControllerHost } from '@mobile/services/controllerHost'

export const ControllersMiddlewareProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { controllerStore, stateSubscriptionManager } = useContext(ControllerStoreContext)
  const webviewRef = useRef<WebViewWorkerRef>(null)
  const hasRequestedDeferredControllers = useRef(false)
  const route = useRoute()
  const isFocused = useIsAppFocused()
  const { state: isAllReady } = useControllerState({
    id: 'SelectedAccountController',
    selector: (state) => !!state?.portfolio?.isAllReady
  })

  const dispatch = useCallback((action: MethodAction | Action) => {
    dispatchToControllers(action)
  }, [])

  // Report which controllers currently have an active subscriber so the controller
  // host can skip serializing the state of controllers no screen is displaying.
  // The SubscriptionManager fires on every first-subscribe /
  // last-unsubscribe; a single screen transition can mount/unmount many hooks at
  // once, so we coalesce to one dispatch per tick using the latest reported set.
  // Critical controllers are always included — they gate unlock/route readiness
  // and must never be suppressed.
  useEffect(() => {
    let latestSubscribed: string[] = []
    let flushHandle: ReturnType<typeof setImmediate> | null = null

    const flush = () => {
      flushHandle = null
      const controllers = Array.from(
        new Set<string>([...MOBILE_CRITICAL_CONTROLLERS, ...latestSubscribed])
      )
      dispatch({ type: 'SET_SUBSCRIBED_CONTROLLERS', params: { controllers } })
    }

    stateSubscriptionManager.setOnSubscribedControllersChange((ids) => {
      latestSubscribed = ids
      if (flushHandle) return
      flushHandle = setImmediate(flush)
    })

    return () => {
      stateSubscriptionManager.setOnSubscribedControllersChange(undefined)
      if (flushHandle) clearImmediate(flushHandle)
    }
  }, [stateSubscriptionManager, dispatch])

  useEffect(() => {
    const config = {
      APP_VERSION,
      RELAYER_URL,
      VELCRO_URL,
      LIFI_EXPLORER_URL,
      BUNGEE_API_KEY,
      SQUID_INTEGRATOR_ID,
      criticalControllers: MOBILE_CRITICAL_CONTROLLERS,
      UNISWAP_API_KEY
    }

    const ctrlsNames = initControllerHost(config)

    // Webview has no controllers now
    // void webviewRef.current?.init(config)

    controllerStore.init(
      ctrlsNames as any[],
      MOBILE_CRITICAL_CONTROLLERS,
      () => {
        dispatch({ type: 'INIT_ALL_CONTROLLERS', params: { controllers: ctrlsNames as any[] } })
      },
      MOBILE_DEFERRED_CONTROLLERS
    )
  }, [controllerStore, dispatch])

  useEffect(() => {
    const { pathname = '/', search = '' } = route
    const searchParams = new URLSearchParams(search)
    const searchParamsFormatted = Object.fromEntries(searchParams.entries())

    dispatch({
      type: 'UPDATE_UI_VIEW_ROUTE',
      params: {
        id: 'default-mobile-app-view',
        route: pathname.startsWith('/') ? pathname.slice(1) : pathname,
        searchParams: searchParamsFormatted
      }
    })
  }, [route.pathname, route.search, dispatch])

  useEffect(() => {
    if (!isFocused) return
    dispatch({ type: 'SET_VIEW_FOCUS', params: { id: 'default-mobile-app-view' } })
  }, [isFocused, dispatch])

  // The dapp catalog and the phishing lists are the two heaviest storage reads, so they
  // stay off the boot path until the portfolio has fully landed - up to that point every
  // frame is contended and their parsing would stall the dashboard. Opening Explore also
  // releases them, because that screen cannot render without the catalog and the
  // portfolio may never reach `isAllReady` (offline, or an account that keeps erroring).
  // Skipped entirely when both already reported ready, which is the case for a returning
  // visit or a flow that needed them earlier and initialized them on demand.
  // Covers the section and webview routes too, which a deep link can open directly
  // without ever passing through Explore itself.
  const path = route.pathname?.replace('/', '') || ''
  const isOnExploreRoute = path.startsWith(ROUTES.explore)
  const isOnDashboard = path.startsWith(ROUTES.dashboard)

  useEffect(() => {
    if (hasRequestedDeferredControllers.current) return
    if ((!isAllReady || !isOnDashboard) && !isOnExploreRoute) return

    const areDeferredControllersLoaded = MOBILE_DEFERRED_CONTROLLERS.every(
      (ctrlName) => (controllerStore.getSnapshot(ctrlName) as { isReady?: boolean }).isReady
    )
    if (areDeferredControllersLoaded) return

    const frameHandle = requestAnimationFrame(() => {
      dispatch({ type: 'INIT_DEFERRED_CONTROLLERS' })
      hasRequestedDeferredControllers.current = true
    })

    return () => cancelAnimationFrame(frameHandle)
  }, [isAllReady, isOnDashboard, isOnExploreRoute, controllerStore, dispatch])

  useRequestsControllerHelpers(dispatch)
  useDappsControllerHelpers(dispatch)
  useCacheDashboardBalance()
  useBootProfileReport()

  return (
    <ControllersMiddlewareContext.Provider value={useMemo(() => ({ dispatch }), [dispatch])}>
      <WebViewWorker ref={webviewRef} />
      {children}
    </ControllersMiddlewareContext.Provider>
  )
}
