import React, { createContext, useEffect } from 'react'

import { INetworksController } from '@ambire-common/interfaces/network'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

const NetworksControllerStateContext = createContext<INetworksController>({} as INetworksController)

const NetworksControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'NetworksController'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()
  const mainState = useMainControllerState()

  useEffect(() => {
    if (!Object.keys(state).length)
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
  }, [dispatch, mainState.isReady, state])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <NetworksControllerStateContext.Provider value={memoizedState}>
      {children}
    </NetworksControllerStateContext.Provider>
  )
}

export { NetworksControllerStateProvider, NetworksControllerStateContext }
