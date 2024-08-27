import React, { createContext, useEffect, useMemo, useState } from 'react'

import useAccountAdderControllerState from '@web/hooks/useAccountAdderControllerState'
import useAccountsControllerState from '@web/hooks/useAccountsControllerState'
import useActionsControllerState from '@web/hooks/useActionsControllerState'
import useActivityControllerState from '@web/hooks/useActivityControllerState'
import useAddressBookControllerState from '@web/hooks/useAddressBookControllerState'
import useDappsControllerState from '@web/hooks/useDappsControllerState'
import useDomainsControllerState from '@web/hooks/useDomainsController/useDomainsController'
import useEmailVaultControllerState from '@web/hooks/useEmailVaultControllerState'
import useInviteControllerState from '@web/hooks/useInviteControllerState'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState/useMainControllerState'
import useNetworksControllerState from '@web/hooks/useNetworksControllerState'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'
import useProvidersControllerState from '@web/hooks/useProvidersControllerState'
import useSignMessageControllerState from '@web/hooks/useSignMessageControllerState'
import useWalletStateController from '@web/hooks/useWalletStateController'

const ControllersStateLoadedContext = createContext<{
  areControllerStatesLoaded: boolean
  isStatesLoadingTakingTooLong: boolean
}>({
  areControllerStatesLoaded: false,
  isStatesLoadingTakingTooLong: false
})

const ControllersStateLoadedProvider: React.FC<any> = ({ children }) => {
  const [areControllerStatesLoaded, setAreControllerStatesLoaded] = useState(false)
  const [isStatesLoadingTakingTooLong, setIsStatesLoadingTakingTooLong] = useState(false)
  const accountAdderState = useAccountAdderControllerState()
  const keystoreState = useKeystoreControllerState()
  const mainState = useMainControllerState()
  const networksState = useNetworksControllerState()
  const providersState = useProvidersControllerState()
  const accountsState = useAccountsControllerState()
  const walletState = useWalletStateController()
  const signMessageState = useSignMessageControllerState()
  const actionsState = useActionsControllerState()
  const activityState = useActivityControllerState()
  const { state: portfolioState } = usePortfolioControllerState()
  const emailVaultState = useEmailVaultControllerState()
  const { state: dappsState } = useDappsControllerState()
  const addressBookState = useAddressBookControllerState()
  const domainsControllerState = useDomainsControllerState()
  const inviteControllerState = useInviteControllerState()

  const hasMainState: boolean = useMemo(
    () => !!Object.keys(mainState).length && !!mainState?.isReady,
    [mainState]
  )
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
  const hasWalletState: boolean = useMemo(
    () => !!Object.keys(walletState).length && !!walletState?.isReady,
    [walletState]
  )
  const hasAccountAdderState: boolean = useMemo(
    () => !!Object.keys(accountAdderState).length,
    [accountAdderState]
  )
  const hasKeystoreState: boolean = useMemo(
    () => !!Object.keys(keystoreState).length,
    [keystoreState]
  )
  const hasSignMessageState: boolean = useMemo(
    () => !!Object.keys(signMessageState).length,
    [signMessageState]
  )
  const hasActionsState: boolean = useMemo(() => !!Object.keys(actionsState).length, [actionsState])
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
      hasNetworksState &&
      hasProvidersState &&
      hasAccountsState &&
      hasWalletState &&
      hasAccountAdderState &&
      hasKeystoreState &&
      hasSignMessageState &&
      hasActionsState &&
      hasPortfolioState &&
      hasActivityState &&
      hasEmailVaultState &&
      hasDappsState &&
      hasDomainsState &&
      hasAddressBookState &&
      hasInviteState
    ) {
      clearTimeout(timeout)
      setAreControllerStatesLoaded(true)
    }

    return () => clearTimeout(timeout)
  }, [
    hasMainState,
    hasNetworksState,
    hasProvidersState,
    hasAccountsState,
    hasWalletState,
    hasAccountAdderState,
    hasKeystoreState,
    hasSignMessageState,
    hasActionsState,
    hasPortfolioState,
    hasActivityState,
    hasEmailVaultState,
    hasDappsState,
    areControllerStatesLoaded,
    hasDomainsState,
    hasAddressBookState,
    hasInviteState
  ])

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
