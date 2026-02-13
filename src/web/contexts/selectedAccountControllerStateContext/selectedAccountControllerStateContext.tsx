import React, { createContext, useEffect, useMemo } from 'react'

import { ISelectedAccountController } from '@ambire-common/interfaces/selectedAccount'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

const SelectedAccountControllerStateContext = createContext<ISelectedAccountController>(
  {} as ISelectedAccountController
)

const SelectedAccountControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'SelectedAccountController'
  const state = useControllerState(controller)
  const { dispatch } = useControllersMiddleware()
  const mainState = useMainControllerState()

  useEffect(() => {
    if (!Object.keys(state).length)
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
  }, [dispatch, mainState.isReady, state])

  return (
    <SelectedAccountControllerStateContext.Provider value={useMemo(() => state, [state])}>
      {children}
    </SelectedAccountControllerStateContext.Provider>
  )
}

export { SelectedAccountControllerStateProvider, SelectedAccountControllerStateContext }
