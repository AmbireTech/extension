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
  const [areControllerStatesLoaded, setAreControllerStatesLoaded] = useState(false)
  const [isStatesLoadingTakingTooLong, setIsStatesLoadingTakingTooLong] = useState(false)

  const { isStoreReady, controllerStore } = useControllerStore()

  useEffect(() => {
    if (areControllerStatesLoaded) return

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
  }, [areControllerStatesLoaded, controllerStore])

  useEffect(() => {
    if (!areControllerStatesLoaded) return

    const elapsed = Date.now() - startTimeRef.current
    const delay = Math.max(0, MIN_LOADING_TIME - elapsed)

    const timeoutId = setTimeout(() => {
      setAreControllerStatesLoaded(true)
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [areControllerStatesLoaded])

  const contextValue = useMemo<ControllersStateLoadedContextType>(
    () => ({
      areControllerStatesLoaded: areControllerStatesLoaded && isStoreReady,
      isStatesLoadingTakingTooLong
    }),
    [areControllerStatesLoaded, isStoreReady, isStatesLoadingTakingTooLong]
  )

  return (
    <ControllersStateLoadedContext.Provider value={contextValue}>
      {children}
    </ControllersStateLoadedContext.Provider>
  )
}

export { ControllersStateLoadedProvider, ControllersStateLoadedContext }
