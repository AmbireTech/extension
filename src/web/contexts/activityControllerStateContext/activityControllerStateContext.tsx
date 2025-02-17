/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect } from 'react'

import { ActivityController } from '@ambire-common/controllers/activity/activity'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

const ActivityControllerStateContext = createContext<ActivityController>({} as ActivityController)

const ActivityControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'activity'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()
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
