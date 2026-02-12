import React, { createContext, useEffect, useMemo } from 'react'

import { ITransferController } from '@ambire-common/interfaces/transfer'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useControllerState from '@web/hooks/useControllerState'

type ContextReturn = {
  state: ITransferController
}

const TransferControllerStateContext = createContext<ContextReturn>({} as ContextReturn)

const TransferControllerStateProvider = ({ children }: { children: any }) => {
  const controller = 'TransferController'
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
    <TransferControllerStateContext.Provider
      value={useMemo(() => ({ state: memoizedState }), [memoizedState])}
    >
      {children}
    </TransferControllerStateContext.Provider>
  )
}

export { TransferControllerStateProvider, TransferControllerStateContext }
