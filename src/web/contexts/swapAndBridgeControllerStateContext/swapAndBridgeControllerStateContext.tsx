/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect } from 'react'

import { ISwapAndBridgeController } from '@ambire-common/interfaces/swapAndBridge'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useControllerState from '@web/hooks/useControllerState'

const SwapAndBridgeControllerStateContext = createContext<ISwapAndBridgeController>(
  {} as ISwapAndBridgeController
)

const SwapAndBridgeControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'SwapAndBridgeController'
  const state = useControllerState(controller)
  const { dispatch } = useControllersMiddleware()
  const { isReady } = useController('MainController').state

  useEffect(() => {
    if (!Object.keys(state).length) {
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
    }
  }, [dispatch, isReady, state])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <SwapAndBridgeControllerStateContext.Provider value={memoizedState}>
      {children}
    </SwapAndBridgeControllerStateContext.Provider>
  )
}

export { SwapAndBridgeControllerStateProvider, SwapAndBridgeControllerStateContext }
