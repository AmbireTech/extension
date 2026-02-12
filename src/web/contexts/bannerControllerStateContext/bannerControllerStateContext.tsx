/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect } from 'react'

import { IBannerController } from '@ambire-common/interfaces/banner'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useControllerState from '@web/hooks/useControllerState'

const BannerControllerStateContext = createContext<IBannerController>({} as IBannerController)

const BannerControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'BannerController'
  const state = useControllerState(controller)
  const { dispatch } = useControllersMiddleware()
  const { isReady } = useController('MainController').state

  useEffect(() => {
    if (isReady && !Object.keys(state).length) {
      dispatch({
        type: 'INIT_CONTROLLER_STATE',
        params: { controller }
      })
    }
  }, [dispatch, isReady, state])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <BannerControllerStateContext.Provider value={memoizedState}>
      {children}
    </BannerControllerStateContext.Provider>
  )
}

export { BannerControllerStateProvider, BannerControllerStateContext }
