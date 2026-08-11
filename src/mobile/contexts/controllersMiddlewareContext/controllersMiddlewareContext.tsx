/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Platform as RNPlatform } from 'react-native'

import { NavigateOptions } from '@ambire-common/interfaces/ui'
import { LIFI_EXPLORER_URL } from '@ambire-common/services/lifi/consts'
import { APP_VERSION } from '@common/config/env'
import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext'
import { ControllerStoreContext } from '@common/contexts/controllerStoreContext'
import useIsAppFocused from '@common/hooks/useIsAppFocused'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import { ROUTES } from '@common/modules/router/constants/common'
import {
  MAX_VIEW_ROUTE_SYNC_ATTEMPTS,
  VIEW_ROUTE_SYNC_RE_ASK_INTERVAL
} from '@common/modules/router/constants/viewRouteSync'
import { toAbsoluteRoute } from '@common/modules/router/helpers/helpers'
import eventBus from '@common/services/event/eventBus'
import { Action, MethodAction } from '@common/types/actions'
import { BUNGEE_API_KEY, RELAYER_URL, SQUID_INTEGRATOR_ID, UNISWAP_API_KEY, VELCRO_URL } from '@env'
import { MOBILE_CRITICAL_CONTROLLERS } from '@mobile/constants/criticalControllers'
import { MOBILE_VIEW_ID } from '@mobile/constants/ui'
import useDappsControllerHelpers from '@mobile/hooks/useDappsControllerHelpers'
import useRequestsControllerHelpers from '@mobile/hooks/useRequestsControllerHelpers'
import { WebViewWorker, WebViewWorkerRef } from '@mobile/modules/webview/services/WebViewWorker'
import { shouldShowMigrationOnboarding } from '@mobile/services/legacyMigration/legacyMigration'

export const ControllersMiddlewareProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { controllerStore, stateSubscriptionManager } = useContext(ControllerStoreContext)
  const webviewRef = useRef<WebViewWorkerRef>(null)
  const route = useRoute()
  const isFocused = useIsAppFocused()
  const { navigate } = useNavigation()
  const [isWorkerReady, setIsWorkerReady] = useState(false)
  const isOnRootRoute = !route.pathname || route.pathname === '/'

  const dispatch = useCallback(
    (action: MethodAction | Action, windowId?: number, raw?: boolean) => {
      webviewRef.current?.dispatch(action, raw)
    },
    []
  )

  // The controllers are authoritative for routing: they send the route to go to and whether the
  // view may be moved at all, so nothing is second-guessed here.
  const handleNavigate = useCallback(
    ({ route: nextRoute, options }: { route: string; options?: NavigateOptions }) => {
      // Users updating from the legacy v1 app land on the migration onboarding (once) before the
      // get-started screen, so they understand why their data is gone and can back up their v1
      // email accounts.
      const destination =
        nextRoute === ROUTES.getStarted && shouldShowMigrationOnboarding()
          ? ROUTES.migrationOnboarding
          : nextRoute

      // Don't navigate if already there
      if (`${route.pathname}${route.search}` === toAbsoluteRoute(destination)) return

      navigate(destination, options)
    },
    [route.pathname, route.search, navigate]
  )

  // Follow where the controllers send the app. Registered before the effect that boots the
  // worker, because registering the view is what triggers the first navigation and the worker
  // only starts from that effect.
  useEffect(() => {
    eventBus.addEventListener('navigate', handleNavigate)

    return () => eventBus.removeEventListener('navigate', handleNavigate)
  }, [handleNavigate])

  // Report which controllers currently have an active subscriber so the WebView
  // worker can skip serializing + bridging the state of controllers no screen is
  // displaying. The SubscriptionManager fires on every first-subscribe /
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
    webviewRef.current
      ?.init({
        APP_VERSION,
        platform: `mobile-${RNPlatform.OS}`,
        RELAYER_URL,
        VELCRO_URL,
        LIFI_EXPLORER_URL,
        BUNGEE_API_KEY,
        SQUID_INTEGRATOR_ID,
        criticalControllers: MOBILE_CRITICAL_CONTROLLERS,
        UNISWAP_API_KEY
      })
      .then((ctrlsNames) => {
        controllerStore.init(ctrlsNames as any[], MOBILE_CRITICAL_CONTROLLERS, () => {
          dispatch({ type: 'INIT_ALL_CONTROLLERS', params: { controllers: ctrlsNames as any[] } })
        })
        setIsWorkerReady(true)
      })
  }, [controllerStore, dispatch])

  // Ask again while there is still nothing on screen, in case the navigation sent when the view
  // registered never arrived. Only once the worker is up, because it drops anything dispatched
  // before that and the attempt would be spent for nothing.
  useEffect(() => {
    if (!isWorkerReady || !isOnRootRoute) return

    let attempts = 0
    let reAskTimeout: ReturnType<typeof setTimeout>

    const askForRoute = () => {
      if (attempts >= MAX_VIEW_ROUTE_SYNC_ATTEMPTS) return
      attempts += 1

      dispatch({ type: 'SYNC_VIEW_ROUTE', params: { id: MOBILE_VIEW_ID } })

      reAskTimeout = setTimeout(askForRoute, VIEW_ROUTE_SYNC_RE_ASK_INTERVAL)
    }

    askForRoute()

    return () => clearTimeout(reAskTimeout)
  }, [isWorkerReady, isOnRootRoute, dispatch])

  useEffect(() => {
    const { pathname = '/', search = '' } = route
    const searchParams = new URLSearchParams(search)
    const searchParamsFormatted = Object.fromEntries(searchParams.entries())

    dispatch({
      type: 'UPDATE_UI_VIEW_ROUTE',
      params: {
        id: MOBILE_VIEW_ID,
        route: pathname.startsWith('/') ? pathname.slice(1) : pathname,
        searchParams: searchParamsFormatted
      }
    })
  }, [route.pathname, route.search, dispatch])

  useEffect(() => {
    if (!isFocused) return
    dispatch({ type: 'SET_VIEW_FOCUS', params: { id: MOBILE_VIEW_ID } })
  }, [isFocused, dispatch])

  useRequestsControllerHelpers(dispatch)
  useDappsControllerHelpers(dispatch)

  return (
    <ControllersMiddlewareContext.Provider value={useMemo(() => ({ dispatch }), [dispatch])}>
      <WebViewWorker ref={webviewRef} />
      {children}
    </ControllersMiddlewareContext.Provider>
  )
}
