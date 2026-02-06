/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect } from 'react'

import { IActivityController } from '@ambire-common/interfaces/activity'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

const ActivityControllerStateContext = createContext<IActivityController>({} as IActivityController)

const ActivityControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'ActivityController'
  const state = useControllerState(controller)
  const { dispatch } = useControllersMiddleware()
  const mainState = useMainControllerState()

  useEffect(() => {
    if (mainState.isReady && !Object.keys(state).length) {
      dispatch({
        type: 'INIT_CONTROLLER_STATE',
        params: { controller }
      })
    }
  }, [dispatch, mainState.isReady, state])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <ActivityControllerStateContext.Provider value={memoizedState}>
      {children}
    </ActivityControllerStateContext.Provider>
  )
}

export { ActivityControllerStateProvider, ActivityControllerStateContext }
