/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect } from 'react'

import { IRequestsController } from '@ambire-common/interfaces/requests'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useControllerState from '@web/hooks/useControllerState'
import { getUiType } from '@web/utils/uiType'

const RequestsControllerStateContext = createContext<IRequestsController>({} as IRequestsController)

const RequestsControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'RequestsController'
  const state = useControllerState(controller)
  const { dispatch } = useControllersMiddleware()

  useEffect(() => {
    dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
    if (getUiType().isRequestWindow) {
      dispatch({ type: 'REQUESTS_CONTROLLER_SET_WINDOW_LOADED' })
    }
  }, [dispatch])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <RequestsControllerStateContext.Provider value={memoizedState}>
      {children}
    </RequestsControllerStateContext.Provider>
  )
}

export { RequestsControllerStateProvider, RequestsControllerStateContext }
