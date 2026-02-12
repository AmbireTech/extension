import React, { createContext, useEffect } from 'react'

import { IAddressBookController } from '@ambire-common/interfaces/addressBook'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useControllerState from '@web/hooks/useControllerState'

const AddressBookControllerStateContext = createContext<IAddressBookController>(
  {} as IAddressBookController
)

const AddressBookControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'AddressBookController'
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
    <AddressBookControllerStateContext.Provider value={memoizedState}>
      {children}
    </AddressBookControllerStateContext.Provider>
  )
}

export { AddressBookControllerStateProvider, AddressBookControllerStateContext }
