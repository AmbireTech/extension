/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { Platform as RNPlatform } from 'react-native'

import { LIFI_EXPLORER_URL } from '@ambire-common/services/lifi/consts'
import { APP_VERSION } from '@common/config/env'
import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext'
import { ControllerStoreContext } from '@common/contexts/controllerStoreContext'
import useIsAppFocused from '@common/hooks/useIsAppFocused'
import useRoute from '@common/hooks/useRoute'
import { Action, MethodAction } from '@common/types/actions'
import { BUNGEE_API_KEY, RELAYER_URL, SQUID_INTEGRATOR_ID, UNISWAP_API_KEY, VELCRO_URL } from '@env'
import { MOBILE_CRITICAL_CONTROLLERS } from '@mobile/constants/criticalControllers'
import useDappsControllerHelpers from '@mobile/hooks/useDappsControllerHelpers'
import useRequestsControllerHelpers from '@mobile/hooks/useRequestsControllerHelpers'
import { WebViewWorker, WebViewWorkerRef } from '@mobile/modules/webview/services/WebViewWorker'

export const ControllersMiddlewareProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { controllerStore, stateSubscriptionManager } = useContext(ControllerStoreContext)
  const webviewRef = useRef<WebViewWorkerRef>(null)
  const route = useRoute()
  const isFocused = useIsAppFocused()

  const dispatch = useCallback(
    (action: MethodAction | Action, windowId?: number, raw?: boolean) => {
      webviewRef.current?.dispatch(action, raw)
    },
    []
  )

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
      })
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

  useRequestsControllerHelpers(dispatch)
  useDappsControllerHelpers(dispatch)

  return (
    <ControllersMiddlewareContext.Provider value={useMemo(() => ({ dispatch }), [dispatch])}>
      <WebViewWorker ref={webviewRef} />
      {children}
    </ControllersMiddlewareContext.Provider>
  )
}
