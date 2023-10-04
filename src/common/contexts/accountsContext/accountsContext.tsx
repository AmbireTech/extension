import useAccounts, {
  UseAccountsProps,
  UseAccountsReturnType
} from 'ambire-common/src/hooks/useAccounts'
import React, { createContext, useCallback, useEffect, useMemo } from 'react'

import * as CrashAnalytics from '@common/config/analytics/CrashAnalytics'
import { isWeb } from '@common/config/env'
import useNavigation from '@common/hooks/useNavigation/useNavigation'
import useStorage from '@common/hooks/useStorage'
import useToasts from '@common/hooks/useToast'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useAuth from '@common/modules/auth/hooks/useAuth'
import { ROUTES } from '@common/modules/router/constants/common'
import useApproval from '@web/hooks/useApproval'
import { ONBOARDING_VALUES } from '@web/modules/onboarding/contexts/onboardingContext/types'
import useOnboarding from '@web/modules/onboarding/hooks/useOnboarding'
import { getUiType } from '@web/utils/uiType'

const AccountsContext = createContext<UseAccountsReturnType>({
  accounts: [],
  account: {},
  selectedAcc: '',
  onSelectAcc: () => {},
  onAddAccount: () => false,
  onRemoveAccount: () => {},
  onRemoveAllAccounts: () => {}
})

const AccountsProvider: React.FC<any> = ({ children }) => {
  const { setAuthStatus, authStatus } = useAuth()
  const { approval } = useApproval()
  const { navigate } = useNavigation()
  const { onboardingStatus } = useOnboarding()
  const onAdd = useCallback<UseAccountsProps['onAdd']>(
    (opts) => {
      if (authStatus !== AUTH_STATUS.AUTHENTICATED) {
        // Flipping the flag is all it's needed, because it changes the
        // Router state that redirects the user to the logged-in state screens.
        return setAuthStatus(AUTH_STATUS.AUTHENTICATED)
      }

      // Should be executed only when a dApp requests permission granting
      // and there are no accounts added yet. (the Auth route will be opened at that time)
      // After adding the first account navigate to PermissionRequest screen
      // Otherwise, skip that step and open directly Dashboard
      if (getUiType().isNotification) {
        if (approval) {
          return
        }
      }

      // If the user is authenticated, a manual redirect is needed,
      // because the logged-in state screens were already mounted.
      if (opts.shouldRedirect) {
        if (onboardingStatus === ONBOARDING_VALUES.ON_BOARDED || !isWeb) {
          navigate(ROUTES.dashboard)
        } else {
          navigate(ROUTES.onboarding)
        }
      }
    },
    [authStatus, setAuthStatus, approval, navigate, onboardingStatus]
  )

  const onRemoveLastAccount = useCallback<UseAccountsProps['onRemoveLastAccount']>(() => {
    setAuthStatus(AUTH_STATUS.NOT_AUTHENTICATED)
  }, [setAuthStatus])

  const {
    accounts,
    account,
    selectedAcc,
    onSelectAcc,
    onAddAccount,
    onRemoveAccount,
    onRemoveAllAccounts
  } = useAccounts({
    useStorage,
    onRemoveLastAccount,
    onAdd,
    useToasts
  })

  useEffect(() => {
    CrashAnalytics.setUserContext({ id: selectedAcc || 'N/A' })
  }, [selectedAcc])

  return (
    <AccountsContext.Provider
      value={useMemo(
        () => ({
          accounts,
          account,
          selectedAcc,
          onSelectAcc,
          onAddAccount,
          onRemoveAccount,
          onRemoveAllAccounts
        }),
        [
          accounts,
          account,
          selectedAcc,
          onSelectAcc,
          onAddAccount,
          onRemoveAccount,
          onRemoveAllAccounts
        ]
      )}
    >
      {children}
    </AccountsContext.Provider>
  )
}

export { AccountsContext, AccountsProvider }
