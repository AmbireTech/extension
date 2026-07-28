import React, { createContext, ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { captureMessage } from '@common/config/analytics/CrashAnalytics.web'
import { APP_VERSION } from '@common/config/env'
import {
  ControllersStateLoadedContext,
  ControllersStateLoadedContextType
} from '@common/contexts/controllersStateLoadedContext'
import useControllerStore from '@common/hooks/useControllerStore'

const MIN_LOADING_TIME = 250

const ControllersStateLoadedProvider = ({ children }: { children: ReactNode }) => {
  const startTimeRef = useRef(Date.now())
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const [hasMinLoadingTimePassed, setHasMinLoadingTimePassed] = useState(false)
  const [isStatesLoadingTakingTooLong, setIsStatesLoadingTakingTooLong] = useState(false)

  const { isStoreReady, isReadyToLoadRoutes, controllerStore } = useControllerStore()

  useEffect(() => {
    if (hasMinLoadingTimePassed) return

    unsubscribeRef.current = controllerStore.addEventsListener((eventData: string) => {
      if (eventData === 'controllersLoadingTakingTooLong') {
        const msg = 'ControllersStateLoadedProvider: states loading taking too long'

        const loadingControllers = Array.from(controllerStore.controllersByName).filter(
          (controllerName) => !controllerStore.initializedControllers.has(controllerName)
        )
        const errorData: any = {
          loadingControllers,
          uiVersion: APP_VERSION
        }

        if (controllerStore.initializedControllers.has('WalletStateController')) {
          errorData.backgroundVersion =
            controllerStore.getSnapshot('WalletStateController').extensionVersion
        }

        setIsStatesLoadingTakingTooLong(true)
        captureMessage(msg, { level: 'warning', extra: errorData })
        console.error(msg)
      }

      if (eventData === 'controllersReady') {
        unsubscribeRef.current?.()
      }
    })
  }, [hasMinLoadingTimePassed, controllerStore])

  useEffect(() => {
    if (hasMinLoadingTimePassed) return

    const elapsed = Date.now() - startTimeRef.current
    const delay = Math.max(0, MIN_LOADING_TIME - elapsed)

    const timeoutId = setTimeout(() => {
      setHasMinLoadingTimePassed(true)
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [hasMinLoadingTimePassed])

  // On mobile the route renders on the critical-controllers-only flag so it shows up
  // ASAP, but never before MIN_LOADING_TIME so the splash doesn't just flash.
  // `areAllControllerStatesLoaded` still fires later, when every controller has
  // crossed the webview bridge.
  const contextValue = useMemo<ControllersStateLoadedContextType>(
    () => ({
      canRenderRoute: hasMinLoadingTimePassed && isReadyToLoadRoutes,
      areAllControllerStatesLoaded: isStoreReady,
      isStatesLoadingTakingTooLong
    }),
    [hasMinLoadingTimePassed, isReadyToLoadRoutes, isStoreReady, isStatesLoadingTakingTooLong]
  )

  return (
    <ControllersStateLoadedContext.Provider value={contextValue}>
      {children}
    </ControllersStateLoadedContext.Provider>
  )
}

export { ControllersStateLoadedProvider, ControllersStateLoadedContext }
