/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect } from 'react'

import { IDomainsController } from '@ambire-common/interfaces/domains'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

const DomainsControllerStateContext = createContext<IDomainsController>({} as IDomainsController)

const DomainsControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'DomainsController'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()
  const mainState = useMainControllerState()

  useEffect(() => {
    if (mainState.isReady && !Object.keys(state).length) {
      dispatch({
        type: 'INIT_CONTROLLER_STATE',
        params: { controller }
      })
    }
  }, [dispatch, mainState.isReady, state])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <DomainsControllerStateContext.Provider value={memoizedState}>
      {children}
    </DomainsControllerStateContext.Provider>
  )
}

export { DomainsControllerStateProvider, DomainsControllerStateContext }
