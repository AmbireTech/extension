/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect } from 'react'

import { IRequestsController } from '@ambire-common/interfaces/requests'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useNavigation from '@common/hooks/useNavigation'
import usePrevious from '@common/hooks/usePrevious'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import { getUiType } from '@web/utils/uiType'

const RequestsControllerStateContext = createContext<IRequestsController>({} as IRequestsController)

const RequestsControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'requests'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()
  const { navigate } = useNavigation()

  useEffect(() => {
    dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
    if (getUiType().isActionWindow) {
      dispatch({ type: 'REQUESTS_CONTROLLER_SET_WINDOW_LOADED' })
    }
  }, [dispatch])

  const memoizedState = useDeepMemo(state, controller)

  const prevCurrentActionId = usePrevious(memoizedState?.actions?.currentAction?.id)

  useEffect(() => {
    if (
      getUiType().isActionWindow &&
      prevCurrentActionId !== memoizedState?.actions?.currentAction?.id
    ) {
      setTimeout(() => navigate('/'))
    }
  }, [prevCurrentActionId, memoizedState?.actions?.currentAction?.id, navigate])

  return (
    <RequestsControllerStateContext.Provider value={memoizedState}>
      {children}
    </RequestsControllerStateContext.Provider>
  )
}

export { RequestsControllerStateProvider, RequestsControllerStateContext }
