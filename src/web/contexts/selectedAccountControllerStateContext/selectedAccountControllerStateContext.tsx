import React, { createContext, useEffect, useMemo } from 'react'

import { ISelectedAccountController } from '@ambire-common/interfaces/selectedAccount'
import { setExtraContext } from '@common/config/analytics/CrashAnalytics'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

const SelectedAccountControllerStateContext = createContext<ISelectedAccountController>(
  {} as ISelectedAccountController
)

const SelectedAccountControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'SelectedAccountController'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()
  const mainState = useMainControllerState()

  useEffect(() => {
    if (!Object.keys(state).length)
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
  }, [dispatch, mainState.isReady, state])

  useEffect(() => {
    if (!state.account?.addr) return

    setExtraContext('address', state.account.addr)
  }, [state.account?.addr])

  return (
    <SelectedAccountControllerStateContext.Provider value={useMemo(() => state, [state])}>
      {children}
    </SelectedAccountControllerStateContext.Provider>
  )
}

export { SelectedAccountControllerStateProvider, SelectedAccountControllerStateContext }
