import React, { createContext, useEffect } from 'react'

import { IPortfolioController } from '@ambire-common/interfaces/portfolio'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'

const PortfolioControllerStateContext = createContext<IPortfolioController>(
  {} as IPortfolioController
)

const PortfolioControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'PortfolioController'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()

  useEffect(() => {
    if (!Object.keys(state).length) {
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
    }
  }, [dispatch, state])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <PortfolioControllerStateContext.Provider value={memoizedState}>
      {children}
    </PortfolioControllerStateContext.Provider>
  )
}

export { PortfolioControllerStateProvider, PortfolioControllerStateContext }
