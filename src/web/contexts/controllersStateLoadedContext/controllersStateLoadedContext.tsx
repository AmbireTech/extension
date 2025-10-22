import React, { createContext, useEffect, useMemo, useRef, useState } from 'react'

import { ControllerInterface } from '@ambire-common/interfaces/controller'
import { captureMessage } from '@common/config/analytics/CrashAnalytics.web'
import { ControllersMappingType } from '@web/extension-services/background/types'
import useAccountPickerControllerState from '@web/hooks/useAccountPickerControllerState'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useActivityControllerState from '@web/hooks/useActivityControllerState'
import useAddressBookControllerState from '@web/hooks/useAddressBookControllerState'
import useBannersControllerState from '@web/hooks/useBannersControllerState'
import useContractNamesControllerState from '@web/hooks/useContractNamesController/useContractNamesController'
import useDappsControllerState from '@web/hooks/useDappsControllerState'
import useDomainsControllerState from '@web/hooks/useDomainsController/useDomainsController'
import useEmailVaultControllerState from '@web/hooks/useEmailVaultControllerState'
import useExtensionUpdateControllerState from '@web/hooks/useExtensionUpdateControllerState'
import useFeatureFlagsControllerState from '@web/hooks/useFeatureFlagsControllerState'
import useInviteControllerState from '@web/hooks/useInviteControllerState'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState/useMainControllerState'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import usePhishingControllerState from '@web/hooks/usePhishingControllerState'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'
import useProvidersControllerState from '@web/hooks/useProvidersControllerState'
import useRequestsControllerState from '@web/hooks/useRequestsControllerState'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'
import useSignMessageControllerState from '@web/hooks/useSignMessageControllerState'
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

const isStateLoaded = (state: any) => {
  if (!state || !Object.keys(state).length) return false
  if ('isReady' in state) return state.isReady === true
  return true
}

type Controllers = {
  [K in keyof ControllersMappingType]: ControllerInterface<ControllersMappingType[K]>
}

type ControllersToWait = Omit<
  Controllers,
  'signAccountOp' | 'autoLock' | 'transfer' | 'defiPositions' | 'autoLogin'
>

const ControllersStateLoadedProvider: React.FC<any> = ({ children }) => {
  const startTimeRef = useRef(Date.now())
  const timeoutRef = useRef<NodeJS.Timeout>()
  const errorDataRef = useRef<any>(null)
  // Safeguard against a potential race condition where one of the controller
  // states might not update properly and the `areControllerStatesLoaded`
  // might get stuck in `false` state forever. If the timeout gets reached,
  // the app displays feedback to the user (via the
  // `isStatesLoadingTakingTooLong` flag).
  const [areControllerStatesLoaded, setAreControllerStatesLoaded] = useState(false)
  const [isStatesLoadingTakingTooLong, setIsStatesLoadingTakingTooLong] = useState(false)

  const accountPicker = useAccountPickerControllerState()
  const keystore = useKeystoreControllerState()
  const main = useMainControllerState()
  const storage = useStorageControllerState()
  const ui = useUiControllerState()
  const networks = useNetworksControllerState()
  const providers = useProvidersControllerState()
  const accounts = useAccountsControllerState()
  const selectedAccount = useSelectedAccountControllerState()
  const walletState = useWalletStateController()
  const signMessage = useSignMessageControllerState()
  const requests = useRequestsControllerState()
  const activity = useActivityControllerState()
  const portfolio = usePortfolioControllerState()
  const emailVault = useEmailVaultControllerState()
  const phishing = usePhishingControllerState()
  const dapps = useDappsControllerState().state
  const addressBook = useAddressBookControllerState()
  const domains = useDomainsControllerState()
  const invite = useInviteControllerState()
  const contractNames = useContractNamesControllerState()
  const banner = useBannersControllerState()
  const swapAndBridge = useSwapAndBridgeControllerState()
  const extensionUpdate = useExtensionUpdateControllerState()
  const featureFlags = useFeatureFlagsControllerState()

  const controllers: ControllersToWait = useMemo(
    () => ({
      accountPicker,
      keystore,
      main,
      storage,
      ui,
      networks,
      providers,
      accounts,
      selectedAccount,
      walletState,
      signMessage,
      requests,
      activity,
      portfolio,
      emailVault,
      phishing,
      dapps,
      addressBook,
      domains,
      invite,
      contractNames,
      banner,
      swapAndBridge,
      extensionUpdate,
      featureFlags
    }),
    [
      accountPicker,
      keystore,
      main,
      storage,
      ui,
      networks,
      providers,
      accounts,
      selectedAccount,
      walletState,
      signMessage,
      requests,
      activity,
      portfolio,
      emailVault,
      phishing,
      dapps,
      addressBook,
      domains,
      invite,
      contractNames,
      banner,
      swapAndBridge,
      extensionUpdate,
      featureFlags
    ]
  )

  const isViewReady = useMemo(() => {
    if (!isPopup) return true

    const popupView = controllers.ui?.views?.find((v) => v.type === 'popup')

    return !!popupView?.isReady
  }, [controllers.ui])

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
      isPopupReady: isViewReady
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
  }, [areControllerStatesLoaded, isViewReady, controllers])

  const contextValue = useMemo(
    () => ({ areControllerStatesLoaded, isStatesLoadingTakingTooLong }),
    [areControllerStatesLoaded, isStatesLoadingTakingTooLong]
  )

  return (
    <ControllersStateLoadedContext.Provider value={contextValue}>
      {children}
    </ControllersStateLoadedContext.Provider>
  )
}

export { ControllersStateLoadedProvider, ControllersStateLoadedContext }
