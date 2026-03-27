import { EventEmitter as Emitter } from 'events'
/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Platform as RNPlatform } from 'react-native'

import { LIFI_EXPLORER_URL } from '@ambire-common/services/lifi/consts'
import { APP_VERSION } from '@common/config/env'
import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext'
import { ControllerStoreContext } from '@common/contexts/controllerStoreContext'
import useRoute from '@common/hooks/useRoute'
import { Action, MethodAction } from '@common/types/actions'
import { BUNGEE_API_KEY, RELAYER_URL, VELCRO_URL } from '@env'
import { MobileBaseControllersMappingType } from '@mobile/constants/controllersMapping'
import useRequestsControllerHelpers from '@mobile/hooks/useRequestsControllerHelpers'

import { WebViewWorker, WebViewWorkerRef } from '../../services/WebViewWorker/WebViewWorker'

// --- POLYFILL FOR REACT NATIVE HERMES / METRO BIND BUG ---
const originalBind = Function.prototype.bind
// @ts-ignore
Function.prototype.bind = function (context: any, ...boundArgs: any[]) {
  const targetFunction = this
  return function (...args: any[]) {
    try {
      const result = targetFunction.call(context, ...boundArgs, ...args)
      if (result && typeof result.then === 'function') {
        return result.catch((e: any) => {
          if (e?.message === 'bad method' || e?.message?.includes('bad method')) {
            return targetFunction.call(
              context,
              ...boundArgs,
              args[0],
              undefined,
              args[1],
              args[2],
              args[3],
              args[4]
            )
          }
          throw e
        })
      }
      return result
    } catch (e: any) {
      if (e?.message === 'bad method' || e?.message?.includes('bad method')) {
        return targetFunction.call(
          context,
          ...boundArgs,
          args[0],
          undefined,
          args[1],
          args[2],
          args[3],
          args[4]
        )
      }
      throw e
    }
  }
}

export const ControllersMiddlewareProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { controllerStore } = useContext(ControllerStoreContext)
  const route = useRoute()
  const webviewRef = useRef<WebViewWorkerRef>(null)

  const controllers = useRef<MobileBaseControllersMappingType>(
    {} as MobileBaseControllersMappingType
  )

  useEffect(() => {
    // We do not re-initialize if the component re-renders
    if (controllers.current.MainController) return

    // Dummy controllers.current to satisfy hooks temporarily
    controllers.current = { MainController: {} } as any

    webviewRef.current
      ?.init({
        APP_VERSION,
        platform: `mobile-${RNPlatform.OS}`,
        RELAYER_URL,
        VELCRO_URL,
        LIFI_EXPLORER_URL,
        BUNGEE_API_KEY
      })
      .then((ctrlsNames) => {
        const ctrlsToInit = ctrlsNames.filter(
          (ctrlName) => ctrlName !== 'ContinuousUpdatesController'
        )
        controllerStore.init(ctrlsToInit as any, () => {
          console.log('dispatching batched init controllers state', ctrlsToInit.length)
          dispatch({ type: 'INIT_ALL_CONTROLLERS', params: { controllers: ctrlsToInit as any } })
        })
      })
  }, [controllerStore])

  const dispatch = useCallback((action: MethodAction | Action) => {
    webviewRef.current?.dispatch(action)
  }, [])

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

  useRequestsControllerHelpers(controllers.current)

  return (
    <ControllersMiddlewareContext.Provider value={useMemo(() => ({ dispatch }), [dispatch])}>
      <WebViewWorker ref={webviewRef} />
      {children}
    </ControllersMiddlewareContext.Provider>
  )
}
