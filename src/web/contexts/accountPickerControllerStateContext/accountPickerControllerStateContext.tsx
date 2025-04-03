/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect } from 'react'

import AccountPickerController from '@ambire-common/controllers/accountPicker/accountPicker'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

const AccountPickerControllerStateContext = createContext<AccountPickerController>(
  {} as AccountPickerController
)

const AccountPickerControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'accountPicker'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()
  const mainState = useMainControllerState()

  useEffect(() => {
    if (!Object.keys(state).length) {
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
    }
  }, [dispatch, mainState.isReady, state])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <AccountPickerControllerStateContext.Provider value={memoizedState}>
      {children}
    </AccountPickerControllerStateContext.Provider>
  )
}

export { AccountPickerControllerStateProvider, AccountPickerControllerStateContext }
