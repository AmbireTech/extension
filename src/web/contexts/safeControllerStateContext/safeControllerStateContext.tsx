import React, { createContext, useEffect } from 'react'

import { ISafeController } from '@ambire-common/interfaces/safe'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

const SafeControllerStateContext = createContext<ISafeController>({} as ISafeController)

const SafeControllerStateProvider = ({ children }: { children: any }) => {
  const controller = 'SafeController'
  const state = useControllerState(controller)
  const { dispatch } = useControllersMiddleware()
  const mainState = useMainControllerState()

  useEffect(() => {
    if (!Object.keys(state).length) {
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
    }
  }, [dispatch, mainState.isReady, state])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <SafeControllerStateContext.Provider value={memoizedState}>
      {children}
    </SafeControllerStateContext.Provider>
  )
}

export { SafeControllerStateContext, SafeControllerStateProvider }
