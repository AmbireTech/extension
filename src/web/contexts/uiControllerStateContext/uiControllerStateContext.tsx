/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect } from 'react'

import { IUiController } from '@ambire-common/interfaces/ui'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'

const UiControllerStateContext = createContext<IUiController>({} as IUiController)

const UiControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'UiController'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()

  useEffect(() => {
    if (!Object.keys(state).length)
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
  }, [dispatch, state])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <UiControllerStateContext.Provider value={memoizedState}>
      {children}
    </UiControllerStateContext.Provider>
  )
}

export { UiControllerStateProvider, UiControllerStateContext }
