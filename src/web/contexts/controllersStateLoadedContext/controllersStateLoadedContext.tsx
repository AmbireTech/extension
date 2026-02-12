import React, { createContext, useEffect, useMemo, useRef, useState } from 'react'

import { captureMessage } from '@common/config/analytics/CrashAnalytics.web'
import { APP_VERSION } from '@common/config/env'
import useControllerStore from '@common/hooks/useControllerStore'
import { isStateLoaded } from '@web/contexts/controllersStateLoadedContext//helpers'
import useAddressBookControllerState from '@web/hooks/useAddressBookControllerState'
import useBannersControllerState from '@web/hooks/useBannersControllerState'
import useContractNamesControllerState from '@web/hooks/useContractNamesController/useContractNamesController'
import useEmailVaultControllerState from '@web/hooks/useEmailVaultControllerState'
import usePhishingControllerState from '@web/hooks/usePhishingControllerState'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'
import useStorageControllerState from '@web/hooks/useStorageControllerState'
import useSwapAndBridgeControllerState from '@web/hooks/useSwapAndBridgeControllerState'
import useUiControllerState from '@web/hooks/useUiControllerState'
import useWalletStateController from '@web/hooks/useWalletStateController'
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

  const StorageController = useStorageControllerState()
  const UiController = useUiControllerState()
  const WalletStateController = useWalletStateController()
  const RequestsController = useRequestsControllerState()
  const PortfolioController = usePortfolioControllerState()
  const EmailVaultController = useEmailVaultControllerState()
  const PhishingController = usePhishingControllerState()
  const AddressBookController = useAddressBookControllerState()
  const ContractNamesController = useContractNamesControllerState()
  const BannerController = useBannersControllerState()
  const SwapAndBridgeController = useSwapAndBridgeControllerState()

  const controllers: any = useMemo(
    () => ({
      StorageController,
      UiController,
      WalletStateController,
      RequestsController,
      PortfolioController,
      EmailVaultController,
      PhishingController,
      AddressBookController,
      ContractNamesController,
      BannerController,
      SwapAndBridgeController
    }),
    [
      StorageController,
      UiController,
      WalletStateController,
      RequestsController,
      PortfolioController,
      EmailVaultController,
      PhishingController,
      AddressBookController,
      ContractNamesController,
      BannerController,
      SwapAndBridgeController
    ]
  )

  const isViewReady = useMemo(() => {
    if (!isPopup) return true

    const popupView = controllers.UiController?.views?.find((v) => v.type === 'popup')

    return !!popupView?.isReady
  }, [controllers.UiController])

  useEffect(() => {
    if (areControllerStatesLoaded) return

    const status: Record<string, boolean> = {}
    const loadingControllers: string[] = []

    Object.entries(controllers).forEach(([name, state]) => {
      const ready = isStateLoaded(state)
      status[name] = ready
      if (!ready) loadingControllers.push(name)
    })

    errorDataRef.current = {
      loadingControllers,
      isPopup,
      isPopupReady: isViewReady,
      backgroundVersion: WalletStateController?.extensionVersion,
      uiVersion: APP_VERSION
    }

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

    const shouldLoad = !loadingControllers.length && isViewReady

    if (shouldLoad) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)

      const elapsed = Date.now() - startTimeRef.current
      const wait = Math.max(0, 400 - elapsed)

      setTimeout(() => {
        setAreControllerStatesLoaded(true)
      }, wait)
    }
  }, [areControllerStatesLoaded, isViewReady, controllers, WalletStateController?.extensionVersion])

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
