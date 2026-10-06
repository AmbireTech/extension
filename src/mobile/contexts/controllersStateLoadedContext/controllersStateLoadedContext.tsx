import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { captureMessage } from '@common/config/analytics/CrashAnalytics.web'
import { APP_VERSION, isDev } from '@common/config/env'
import {
  ControllersStateLoadedContext,
  ControllersStateLoadedContextType
} from '@common/contexts/controllersStateLoadedContext'
import useControllerStore from '@common/hooks/useControllerStore'
import { MOBILE_DEFERRED_CONTROLLERS } from '@mobile/constants/criticalControllers'

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

        // The deferred controllers are pending on purpose at this point, so listing them
        // would send the report chasing a stall that isn't one.
        const loadingControllers = Array.from(controllerStore.controllersByName).filter(
          (controllerName) =>
            !controllerStore.initializedControllers.has(controllerName) &&
            !MOBILE_DEFERRED_CONTROLLERS.includes(controllerName)
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
        // In dev this can fire from a local setup problem rather than a real
        // stall, which is not worth a Sentry event.
        if (!isDev) captureMessage(msg, { level: 'warning', extra: errorData })
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
  // ASAP, but never before MIN_LOADING_TIME so the splash doesn't just flash. The
  // loaded flag fires later and is what a screen reading beyond the critical subset
  // waits on. It does not wait on the dapp catalog and the phishing lists, which only
  // start loading once the portfolio is in.
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
