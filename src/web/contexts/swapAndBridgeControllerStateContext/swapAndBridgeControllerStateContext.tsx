/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect } from 'react'

import { ISwapAndBridgeController } from '@ambire-common/interfaces/swapAndBridge'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

const SwapAndBridgeControllerStateContext = createContext<ISwapAndBridgeController>(
  {} as ISwapAndBridgeController
)

const SwapAndBridgeControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'SwapAndBridgeController'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()
  const mainState = useMainControllerState()

  useEffect(() => {
    if (!Object.keys(state).length) {
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
    }
  }, [dispatch, mainState.isReady, state])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <SwapAndBridgeControllerStateContext.Provider value={memoizedState}>
      {children}
    </SwapAndBridgeControllerStateContext.Provider>
  )
}

export { SwapAndBridgeControllerStateProvider, SwapAndBridgeControllerStateContext }
