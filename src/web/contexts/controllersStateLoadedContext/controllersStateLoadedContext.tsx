import React, { createContext, useEffect, useMemo, useRef, useState } from 'react'

import { captureMessage } from '@common/config/analytics/CrashAnalytics.web'
import useController from '@common/hooks/useController'
import useControllerStore from '@common/hooks/useControllerStore'
import { getUiType } from '@web/utils/uiType'

const ControllersStateLoadedContext = createContext<{
  areControllerStatesLoaded: boolean
  isStatesLoadingTakingTooLong: boolean
}>({
  areControllerStatesLoaded: false,
  isStatesLoadingTakingTooLong: false
})

const { isPopup } = getUiType()

const ControllersStateLoadedProvider: React.FC<any> = ({ children }) => {
  const startTimeRef = useRef(Date.now())
  const timeoutRef = useRef<NodeJS.Timeout>(null)
  const errorDataRef = useRef<any>(null)
  // Safeguard against a potential race condition where one of the controller
  // states might not update properly and the `areControllerStatesLoaded`
  // might get stuck in `false` state forever. If the timeout gets reached,
  // the app displays feedback to the user (via the
  // `isStatesLoadingTakingTooLong` flag).
  const [areControllerStatesLoaded, setAreControllerStatesLoaded] = useState(false)
  const [isStatesLoadingTakingTooLong, setIsStatesLoadingTakingTooLong] = useState(false)
  const { isStoreReady } = useControllerStore()

  const { state: uiControllerState } = useController('UiController')

  const isViewReady = useMemo(() => {
    if (!isPopup) return true

    const popupView = uiControllerState?.views?.find((v: any) => v.type === 'popup')

    return !!popupView?.isReady
  }, [uiControllerState])

  useEffect(() => {
    if (areControllerStatesLoaded) return

    // Don't clear this timeout to ensure that the state will be set
    // Also start it only once
    if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        // Done like this because state read in setTimeout
        // is from the time it was set, not when it executes
        const errorData = errorDataRef.current || {}

        setIsStatesLoadingTakingTooLong(true)
        captureMessage('ControllersStateLoadedProvider: states loading taking too long', {
          level: 'warning',
          extra: errorData
        })
        console.error('ControllersStateLoadedProvider: states loading taking too long', errorData)
      }, 10000)
    }

    if (isViewReady) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      const elapsed = Date.now() - startTimeRef.current
      const wait = Math.max(0, 400 - elapsed)

      setTimeout(() => {
        setAreControllerStatesLoaded(true)
      }, wait)
    }
  }, [areControllerStatesLoaded, isViewReady])

  const contextValue = useMemo(
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
