import React, { createContext, useEffect } from 'react'

import { IProvidersController } from '@ambire-common/interfaces/provider'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

const ProvidersControllerStateContext = createContext<IProvidersController>(
  {} as IProvidersController
)

const ProvidersControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'ProvidersController'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()
  const mainState = useMainControllerState()

  useEffect(() => {
    if (!Object.keys(state).length)
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
  }, [dispatch, mainState.isReady, state])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <ProvidersControllerStateContext.Provider value={memoizedState}>
      {children}
    </ProvidersControllerStateContext.Provider>
  )
}

export { ProvidersControllerStateProvider, ProvidersControllerStateContext }
