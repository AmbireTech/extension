import React, { createContext, ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { captureMessage } from '@common/config/analytics/CrashAnalytics.web'
import { APP_VERSION } from '@common/config/env'
import {
  ControllersStateLoadedContext,
  ControllersStateLoadedContextType
} from '@common/contexts/controllersStateLoadedContext'
import useController from '@common/hooks/useController'
import useControllerStore from '@common/hooks/useControllerStore'
import { getUiType } from '@common/utils/uiType'

const { isPopup } = getUiType()

const ControllersStateLoadedProvider = ({ children }: { children: ReactNode }) => {
  // const startTimeRef = useRef(Date.now())
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const [isStatesLoadingTakingTooLong, setIsStatesLoadingTakingTooLong] = useState(false)

  const { isStoreReady, isReadyToLoadRoutes, controllerStore } = useControllerStore()
  const { state: uiControllerState } = useController('UiController')

  const isViewReady = useMemo(() => {
    if (!isPopup) return true

    return uiControllerState?.views?.some((v: any) => v.type === 'popup' && v.isReady) ?? false
  }, [uiControllerState])

  useEffect(() => {
    if (isStoreReady) return

    unsubscribeRef.current = controllerStore.addEventsListener((eventData: string) => {
      if (eventData === 'controllersLoadingTakingTooLong') {
        const msg = 'ControllersStateLoadedProvider: states loading taking too long'

        const loadingControllers = Array.from(controllerStore.controllersByName).filter(
          (controllerName) => !controllerStore.initializedControllers.has(controllerName)
        )
        const errorData: any = {
          loadingControllers,
          isPopup,
          isPopupReady: isViewReady,
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
  }, [isViewReady, controllerStore, isStoreReady])

  // When the background reports a dashboard route, the store flips
  // `isReadyToLoadRoutes` as soon as the dashboard subset lands, hiding the splash
  // before the heavier controllers finish. For other routes no critical subset is
  // set, so this stays false and we fall back to the full `isStoreReady`. Screens
  // that need the deferred controllers should gate on `isStoreReady` directly.
  const contextValue = useMemo<ControllersStateLoadedContextType>(
    () => ({
      areControllerStatesLoaded: isReadyToLoadRoutes || isStoreReady,
      isStatesLoadingTakingTooLong
    }),
    [isReadyToLoadRoutes, isStoreReady, isStatesLoadingTakingTooLong]
  )

  return (
    <ControllersStateLoadedContext.Provider value={contextValue}>
      {children}
    </ControllersStateLoadedContext.Provider>
  )
}

export { ControllersStateLoadedProvider, ControllersStateLoadedContext }
