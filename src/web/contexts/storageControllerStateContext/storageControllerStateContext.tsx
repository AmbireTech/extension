import React, { createContext, useEffect } from 'react'

import { IStorageController } from '@ambire-common/interfaces/storage'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'

const StorageControllerStateContext = createContext<IStorageController>({} as IStorageController)

const StorageControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'StorageController'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()

  useEffect(() => {
    if (!Object.keys(state).length)
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
  }, [dispatch, state])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <StorageControllerStateContext.Provider value={memoizedState}>
      {children}
    </StorageControllerStateContext.Provider>
  )
}

export { StorageControllerStateProvider, StorageControllerStateContext }
