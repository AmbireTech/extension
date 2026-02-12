import React, { createContext, useEffect } from 'react'

import { IPhishingController } from '@ambire-common/interfaces/phishing'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useControllerState from '@web/hooks/useControllerState'

const PhishingControllerStateContext = createContext<IPhishingController>({} as IPhishingController)

const PhishingControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'PhishingController'
  const state = useControllerState(controller)
  const { dispatch } = useControllersMiddleware()
  const { isReady } = useController('MainController').state

  useEffect(() => {
    if (!Object.keys(state).length)
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
  }, [dispatch, isReady, state])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <PhishingControllerStateContext.Provider value={memoizedState}>
      {children}
    </PhishingControllerStateContext.Provider>
  )
}

export { PhishingControllerStateProvider, PhishingControllerStateContext }
