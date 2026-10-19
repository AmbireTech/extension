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
const selectSelectedType = (state: SelectedAccountState) => state.selectedType
const selectIsSelectedAccountReady = (state: SelectedAccountState) => state.isReady

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: selectedType } = useController('SelectedAccountController', selectSelectedType)
  const { state: isReady } = useController(
    'SelectedAccountController',
    selectIsSelectedAccountReady
  )

  const authStatus = useMemo(() => {
    if (!accounts || !isReady) return AUTH_STATUS.LOADING

    // A private account counts too, and it may be the only account
    return selectedType ? AUTH_STATUS.AUTHENTICATED : AUTH_STATUS.NOT_AUTHENTICATED
  }, [accounts, isReady, selectedType])

  return (
    <AuthContext.Provider value={useMemo(() => ({ authStatus }), [authStatus])}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext, AuthProvider }
