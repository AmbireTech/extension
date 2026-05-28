/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { Platform as RNPlatform } from 'react-native'

import { LIFI_EXPLORER_URL } from '@ambire-common/services/lifi/consts'
import { APP_VERSION } from '@common/config/env'
import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext'
import { ControllerStoreContext } from '@common/contexts/controllerStoreContext'
import useRoute from '@common/hooks/useRoute'
import { Action, MethodAction } from '@common/types/actions'
import { BUNGEE_API_KEY, RELAYER_URL, SQUID_INTEGRATOR_ID, VELCRO_URL } from '@env'
import { MOBILE_CRITICAL_CONTROLLERS } from '@mobile/constants/criticalControllers'
import useDappsControllerHelpers from '@mobile/hooks/useDappsControllerHelpers'
import useRequestsControllerHelpers from '@mobile/hooks/useRequestsControllerHelpers'
import { WebViewWorker, WebViewWorkerRef } from '@mobile/modules/webview/services/WebViewWorker'

export const ControllersMiddlewareProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { controllerStore } = useContext(ControllerStoreContext)
  const webviewRef = useRef<WebViewWorkerRef>(null)
  const route = useRoute()

  const dispatch = useCallback(
    (action: MethodAction | Action, windowId?: number, raw?: boolean) => {
      webviewRef.current?.dispatch(action, raw)
    },
    []
  )

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
        criticalControllers: MOBILE_CRITICAL_CONTROLLERS
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

  useRequestsControllerHelpers(dispatch)
  useDappsControllerHelpers(dispatch)

  return (
    <ControllersMiddlewareContext.Provider value={useMemo(() => ({ dispatch }), [dispatch])}>
      <WebViewWorker ref={webviewRef} />
      {children}
    </ControllersMiddlewareContext.Provider>
  )
}
