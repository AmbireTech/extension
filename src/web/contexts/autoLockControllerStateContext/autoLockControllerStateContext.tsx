/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect, useMemo } from 'react'
import { useIdleTimer } from 'react-idle-timer'

import { AutoLockController } from '@web/extension-services/background/controllers/auto-lock'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'

const AutoLockControllerStateContext = createContext<AutoLockController>({} as AutoLockController)

const AutoLockControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'AutoLockController'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()

  useEffect(() => {
    dispatch({
      type: 'INIT_CONTROLLER_STATE',
      params: { controller }
    })
  }, [dispatch])

  useEffect(() => {
    // reset lock timer on window open
    dispatch({ type: 'AUTO_LOCK_CONTROLLER_SET_LAST_ACTIVE_TIME' })
  }, [dispatch])

  useIdleTimer({
    onAction(e) {
      if (!e) return

      if (['mousedown', 'mousemove'].includes(e.type) && (state?.autoLockTime || 0) > 0) {
        // reset lock timer on mouse click or mouse move (user is active)
        dispatch({ type: 'AUTO_LOCK_CONTROLLER_SET_LAST_ACTIVE_TIME' })
      }
    },
    throttle: 5000
  })

  return (
    <AutoLockControllerStateContext.Provider value={useMemo(() => state, [state])}>
      {children}
    </AutoLockControllerStateContext.Provider>
  )
}

export { AutoLockControllerStateProvider, AutoLockControllerStateContext }
