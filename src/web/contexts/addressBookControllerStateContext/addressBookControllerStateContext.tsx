import React, { createContext, useEffect } from 'react'

import { IAddressBookController } from '@ambire-common/interfaces/addressBook'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

const AddressBookControllerStateContext = createContext<IAddressBookController>(
  {} as IAddressBookController
)

const AddressBookControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'AddressBookController'
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
    <AddressBookControllerStateContext.Provider value={memoizedState}>
      {children}
    </AddressBookControllerStateContext.Provider>
  )
}

export { AddressBookControllerStateProvider, AddressBookControllerStateContext }
