/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect, useMemo } from 'react'

import { IInviteController } from '@ambire-common/interfaces/invite'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

const InviteControllerStateContext = createContext<IInviteController>({} as IInviteController)

const CONTROLLER_NAME = 'InviteController'
const InviteControllerStateProvider: React.FC<any> = ({ children }) => {
  const state = useControllerState(CONTROLLER_NAME)
  const { dispatch } = useBackgroundService()
  const mainState = useMainControllerState()

  useEffect(() => {
    if (mainState.isReady && !Object.keys(state).length) {
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller: CONTROLLER_NAME } })
    }
  }, [dispatch, mainState.isReady, state])

  return (
    <InviteControllerStateContext.Provider value={useMemo(() => state, [state])}>
      {children}
    </InviteControllerStateContext.Provider>
  )
}

export { InviteControllerStateProvider, InviteControllerStateContext }
