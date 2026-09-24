import React, { createContext, useMemo } from 'react'

import useController from '@common/hooks/useController'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

type AuthContextData = {
  authStatus: AUTH_STATUS
}

const AuthContext = createContext<AuthContextData>({
  authStatus: AUTH_STATUS.LOADING
})

type SelectedAccountState = AllControllersMappingType['SelectedAccountController']

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectSelectedAccount = (state: SelectedAccountState) => state.account
const selectPrivacyPoolsAccountId = (state: SelectedAccountState) => state.privacyPoolsAccountId
const selectIsSelectedAccountReady = (state: SelectedAccountState) => state.isReady

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: account } = useController('SelectedAccountController', selectSelectedAccount)
  const { state: privacyPoolsAccountId } = useController(
    'SelectedAccountController',
    selectPrivacyPoolsAccountId
  )
  const { state: isReady } = useController(
    'SelectedAccountController',
    selectIsSelectedAccountReady
  )

  const authStatus = useMemo(() => {
    if (!accounts || !isReady) return AUTH_STATUS.LOADING

    // A Privacy Pools account is selected in place of a regular one, which leaves `account` null -
    // and it can be the only kind of account in the wallet
    if (privacyPoolsAccountId) return AUTH_STATUS.AUTHENTICATED

    if (!accounts?.length || !account) {
      return AUTH_STATUS.NOT_AUTHENTICATED
    }

    return AUTH_STATUS.AUTHENTICATED
  }, [accounts, isReady, account, privacyPoolsAccountId])

  return (
    <AuthContext.Provider value={useMemo(() => ({ authStatus }), [authStatus])}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext, AuthProvider }
