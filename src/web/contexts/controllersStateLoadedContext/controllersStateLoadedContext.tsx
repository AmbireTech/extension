import React, { createContext, useEffect, useMemo, useState } from 'react'

import useAccountPickerControllerState from '@web/hooks/useAccountPickerControllerState'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useActivityControllerState from '@web/hooks/useActivityControllerState'
import useAddressBookControllerState from '@web/hooks/useAddressBookControllerState'
import useBackgroundService from '@web/hooks/useBackgroundService'
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

const ControllersStateLoadedProvider: React.FC<any> = ({ children }) => {
  const [startTime] = useState(() => Date.now())

  const [areControllerStatesLoaded, setAreControllerStatesLoaded] = useState(false)
  const [shouldWaitForMainCtrlStatus, setShouldWaitForMainCtrlStatus] = useState(false)
  const [isStatesLoadingTakingTooLong, setIsStatesLoadingTakingTooLong] = useState(false)
  const { dispatch } = useBackgroundService()
  const accountPickerState = useAccountPickerControllerState()
  const keystoreState = useKeystoreControllerState()
  const mainState = useMainControllerState()
  const storageCtrl = useStorageControllerState()
  const uiCtrl = useUiControllerState()
  const networksState = useNetworksControllerState()
  const providersState = useProvidersControllerState()
  const accountsState = useAccountsControllerState()
  const selectedAccountState = useSelectedAccountControllerState()
  const walletState = useWalletStateController()
  const signMessageState = useSignMessageControllerState()
  const requestsState = useRequestsControllerState()
  const activityState = useActivityControllerState()
  const portfolioState = usePortfolioControllerState()
  const emailVaultState = useEmailVaultControllerState()
  const phishingState = usePhishingControllerState()
  const { state: dappsState } = useDappsControllerState()
  const addressBookState = useAddressBookControllerState()
  const domainsControllerState = useDomainsControllerState()
  const inviteControllerState = useInviteControllerState()
  const contractNamesState = useContractNamesControllerState()
  const bannersState = useBannersControllerState()

  const swapAndBridgeControllerState = useSwapAndBridgeControllerState()
  const extensionUpdateControllerState = useExtensionUpdateControllerState()
  const featureFlagsControllerState = useFeatureFlagsControllerState()

  const hasMainState: boolean = useMemo(
    () => !!Object.keys(mainState).length && !!mainState?.isReady,
    [mainState]
  )
  const hasStorageState: boolean = useMemo(() => !!Object.keys(storageCtrl).length, [storageCtrl])
  const hasUiState: boolean = useMemo(() => !!Object.keys(uiCtrl).length, [uiCtrl])
  const hasNetworksState: boolean = useMemo(
    () => !!Object.keys(networksState).length,
    [networksState]
  )
  const hasProvidersState: boolean = useMemo(
    () => !!Object.keys(providersState).length,
    [providersState]
  )
  const hasAccountsState: boolean = useMemo(
    () => !!Object.keys(accountsState).length,
    [accountsState]
  )
  const hasSelectedAccountState: boolean = useMemo(
    () => !!Object.keys(selectedAccountState).length,
    [selectedAccountState]
  )
  const hasWalletState: boolean = useMemo(
    () => !!Object.keys(walletState).length && !!walletState?.isReady,
    [walletState]
  )
  const hasAccountPickerState: boolean = useMemo(
    () => !!Object.keys(accountPickerState).length,
    [accountPickerState]
  )
  const hasKeystoreState: boolean = useMemo(
    () => !!Object.keys(keystoreState).length,
    [keystoreState]
  )
  const hasSignMessageState: boolean = useMemo(
    () => !!Object.keys(signMessageState).length,
    [signMessageState]
  )
  const hasRequestsState: boolean = useMemo(
    () => !!Object.keys(requestsState).length,
    [requestsState]
  )
  const hasPortfolioState: boolean = useMemo(
    () => !!Object.keys(portfolioState).length,
    [portfolioState]
  )
  const hasActivityState: boolean = useMemo(
    () => !!Object.keys(activityState).length,
    [activityState]
  )
  const hasEmailVaultState: boolean = useMemo(
    () => !!Object.keys(emailVaultState).length && !!emailVaultState?.isReady,
    [emailVaultState]
  )
  const hasPhishingState: boolean = useMemo(
    () => !!Object.keys(phishingState).length,
    [phishingState]
  )
  const hasDappsState: boolean = useMemo(
    () => !!Object.keys(dappsState).length && dappsState.isReady,
    [dappsState]
  )
  const hasDomainsState: boolean = useMemo(
    () => !!Object.keys(domainsControllerState).length,
    [domainsControllerState]
  )
  const hasAddressBookState: boolean = useMemo(
    () => !!Object.keys(addressBookState).length,
    [addressBookState]
  )
  const hasInviteState: boolean = useMemo(
    () => !!Object.keys(inviteControllerState).length,
    [inviteControllerState]
  )
  const hasSwapAndBridgeState: boolean = useMemo(
    () => !!Object.keys(swapAndBridgeControllerState).length,
    [swapAndBridgeControllerState]
  )
  const hasExtensionUpdateState: boolean = useMemo(
    () => !!Object.keys(extensionUpdateControllerState).length,
    [extensionUpdateControllerState]
  )
  const hasFeatureFlagsControllerState: boolean = useMemo(
    () => !!Object.keys(featureFlagsControllerState).length,
    [featureFlagsControllerState]
  )
  const hasContractNamesControllerState: boolean = useMemo(
    () => !!Object.keys(contractNamesState).length,
    [contractNamesState]
  )
  const hasBannersState: boolean = useMemo(() => !!Object.keys(bannersState).length, [bannersState])

  useEffect(() => {
    if (areControllerStatesLoaded) return
    // Safeguard against a potential race condition where one of the controller
    // states might not update properly and the `areControllerStatesLoaded`
    // might get stuck in `false` state forever. If the timeout gets reached,
    // the app displays feedback to the user (via the
    // `isStatesLoadingTakingTooLong` flag).
    const timeout = setTimeout(() => setIsStatesLoadingTakingTooLong(true), 10000)
    if (
      hasMainState &&
      hasStorageState &&
      hasUiState &&
      hasNetworksState &&
      hasProvidersState &&
      hasAccountsState &&
      hasSelectedAccountState &&
      hasWalletState &&
      hasAccountPickerState &&
      hasKeystoreState &&
      hasSignMessageState &&
      hasRequestsState &&
      hasPortfolioState &&
      hasActivityState &&
      hasEmailVaultState &&
      hasPhishingState &&
      hasDappsState &&
      hasDomainsState &&
      hasAddressBookState &&
      hasInviteState &&
      hasSwapAndBridgeState &&
      hasExtensionUpdateState &&
      hasFeatureFlagsControllerState &&
      hasContractNamesControllerState &&
      hasBannersState
    ) {
      clearTimeout(timeout)
      if (isPopup) {
        setShouldWaitForMainCtrlStatus(true)
      } else {
        const elapsed = Date.now() - startTime
        const wait = Math.max(0, 400 - elapsed)

        // Don't clear this timeout to ensure that the state will be set
        setTimeout(() => {
          setAreControllerStatesLoaded(true)
        }, wait)
      }
    }

    return () => clearTimeout(timeout)
  }, [
    hasMainState,
    hasStorageState,
    hasUiState,
    hasNetworksState,
    hasProvidersState,
    hasAccountsState,
    hasSelectedAccountState,
    hasWalletState,
    hasAccountPickerState,
    hasKeystoreState,
    hasSignMessageState,
    hasRequestsState,
    hasPortfolioState,
    hasActivityState,
    hasEmailVaultState,
    hasPhishingState,
    hasDappsState,
    areControllerStatesLoaded,
    hasDomainsState,
    hasAddressBookState,
    hasInviteState,
    hasSwapAndBridgeState,
    hasExtensionUpdateState,
    hasFeatureFlagsControllerState,
    hasContractNamesControllerState,
    hasBannersState,
    dispatch,
    startTime
  ])

  useEffect(() => {
    if (areControllerStatesLoaded || !shouldWaitForMainCtrlStatus) return
    if (!hasUiState) return

    const popupView = uiCtrl.views.find((v) => v.type === 'popup')
    if (!popupView || !popupView.isReady) return

    const elapsed = Date.now() - startTime
    const wait = Math.max(0, 400 - elapsed)

    // Don't clear this timeout to ensure that the state will be set
    setTimeout(() => {
      setAreControllerStatesLoaded(true)
      setShouldWaitForMainCtrlStatus(false)
    }, wait)
  }, [shouldWaitForMainCtrlStatus, hasUiState, uiCtrl.views, startTime, areControllerStatesLoaded])

  return (
    <ControllersStateLoadedContext.Provider
      value={useMemo(
        () => ({ areControllerStatesLoaded, isStatesLoadingTakingTooLong }),
        [areControllerStatesLoaded, isStatesLoadingTakingTooLong]
      )}
    >
      {children}
    </ControllersStateLoadedContext.Provider>
  )
}

export { ControllersStateLoadedProvider, ControllersStateLoadedContext }
