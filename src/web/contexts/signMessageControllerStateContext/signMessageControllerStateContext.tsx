/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect } from 'react'

import { ISignMessageController } from '@ambire-common/interfaces/signMessage'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useControllerState from '@web/hooks/useControllerState'

const SignMessageControllerStateContext = createContext<ISignMessageController>(
  {} as ISignMessageController
)

const SignMessageControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'SignMessageController'
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
    <SignMessageControllerStateContext.Provider value={memoizedState}>
      {children}
    </SignMessageControllerStateContext.Provider>
  )
}

export { SignMessageControllerStateProvider, SignMessageControllerStateContext }
