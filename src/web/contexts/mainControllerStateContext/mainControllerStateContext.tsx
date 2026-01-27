/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect } from 'react'

import { IMainController } from '@ambire-common/interfaces/main'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'

const MainControllerStateContext = createContext<IMainController>({} as IMainController)

const MainControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'MainController'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()
  useEffect(() => {
    dispatch({
      type: 'INIT_CONTROLLER_STATE',
      params: { controller }
    })
  }, [dispatch])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <MainControllerStateContext.Provider value={memoizedState}>
      {children}
    </MainControllerStateContext.Provider>
  )
}

export { MainControllerStateProvider, MainControllerStateContext }
