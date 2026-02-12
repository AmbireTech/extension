/* eslint-disable @typescript-eslint/no-floating-promises */
import React, { createContext, useMemo } from 'react'

import useController from '@common/hooks/useController'
import { AUTH_STATUS } from '@common/modules/auth/constants/authStatus'
import useSelectedAccountControllerState from '@web/hooks/useSelectedAccountControllerState'

type AuthContextData = {
  authStatus: AUTH_STATUS
}

const AuthContext = createContext<AuthContextData>({
  authStatus: AUTH_STATUS.LOADING
})

const AuthProvider: React.FC = ({ children }: any) => {
  const accountsState = useController('AccountsController').state
  const { account, isReady } = useSelectedAccountControllerState()

  const authStatus = useMemo(() => {
    if (!accountsState.accounts || !isReady) return AUTH_STATUS.LOADING

    if (!accountsState.accounts?.length || !account) {
      return AUTH_STATUS.NOT_AUTHENTICATED
    }

    return AUTH_STATUS.AUTHENTICATED
  }, [accountsState.accounts, isReady, account])

  return (
    <AuthContext.Provider value={useMemo(() => ({ authStatus }), [authStatus])}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext, AuthProvider }
