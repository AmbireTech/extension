import React, { createContext, ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { captureMessage } from '@common/config/analytics/CrashAnalytics.web'
import useController from '@common/hooks/useController'
import useControllerStore from '@common/hooks/useControllerStore'
import { getUiType } from '@web/utils/uiType'

interface ControllersStateLoadedContextType {
  areControllerStatesLoaded: boolean
  isStatesLoadingTakingTooLong: boolean
}

const ControllersStateLoadedContext = createContext<ControllersStateLoadedContextType>({
  areControllerStatesLoaded: false,
  isStatesLoadingTakingTooLong: false
})

const { isPopup } = getUiType()
const MIN_LOADING_TIME = 400
const TIMEOUT_LIMIT = 10000

const ControllersStateLoadedProvider = ({ children }: { children: ReactNode }) => {
  const startTimeRef = useRef(Date.now())
  const [areControllerStatesLoaded, setAreControllerStatesLoaded] = useState(false)
  const [isStatesLoadingTakingTooLong, setIsStatesLoadingTakingTooLong] = useState(false)

  const { isStoreReady } = useControllerStore()
  const { state: uiControllerState } = useController('UiController')

  const isViewReady = useMemo(() => {
    if (!isPopup) return true

<<<<<<< HEAD
    return uiControllerState?.views?.some((v: any) => v.type === 'popup' && v.isReady) ?? false
  }, [uiControllerState])
=======
    const popupView = controllers.UiController?.views?.find((v: any) => v.type === 'popup')

    return !!popupView?.isReady
  }, [controllers.UiController])
>>>>>>> refactor/make-main-controller-compatible-for-different-environments

  useEffect(() => {
    if (areControllerStatesLoaded) return

    const timeoutId = setTimeout(() => {
      setIsStatesLoadingTakingTooLong(true)
      const msg = 'ControllersStateLoadedProvider: states loading taking too long'

      captureMessage(msg, { level: 'warning' })
      console.error(msg)
    }, TIMEOUT_LIMIT)

    return () => clearTimeout(timeoutId)
  }, [areControllerStatesLoaded])

  useEffect(() => {
    if (!isViewReady || areControllerStatesLoaded) return

    const elapsed = Date.now() - startTimeRef.current
    const delay = Math.max(0, MIN_LOADING_TIME - elapsed)

    const timeoutId = setTimeout(() => {
      setAreControllerStatesLoaded(true)
    }, delay)

    return () => clearTimeout(timeoutId)
  }, [isViewReady, areControllerStatesLoaded])

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
