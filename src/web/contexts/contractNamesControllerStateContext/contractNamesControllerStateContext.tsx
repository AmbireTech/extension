/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect } from 'react'

import { IContractNamesController } from '@ambire-common/interfaces/contractNames'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

const ContractNamesControllerStateContext = createContext<IContractNamesController>(
  {} as IContractNamesController
)

const ContractNamesControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'ContractNamesController'
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
    <ContractNamesControllerStateContext.Provider value={memoizedState}>
      {children}
    </ContractNamesControllerStateContext.Provider>
  )
}

export { ContractNamesControllerStateProvider, ContractNamesControllerStateContext }
