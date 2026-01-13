import React, { createContext, useEffect } from 'react'

import { IAccountsController } from '@ambire-common/interfaces/account'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

const AccountsControllerStateContext = createContext<IAccountsController>({} as IAccountsController)

const AccountsControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'AccountsController'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()
  const mainState = useMainControllerState()

  useEffect(() => {
    if (!Object.keys(state).length)
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
  }, [dispatch, mainState.isReady, state])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <AccountsControllerStateContext.Provider value={memoizedState}>
      {children}
    </AccountsControllerStateContext.Provider>
  )
}

export { AccountsControllerStateProvider, AccountsControllerStateContext }
