/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect } from 'react'

import { IKeystoreController } from '@ambire-common/interfaces/keystore'
import { setUserContext } from '@common/config/analytics/CrashAnalytics'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'
import { getExtensionInstanceId } from '@web/utils/analytics'

const KeystoreControllerStateContext = createContext<IKeystoreController>({} as IKeystoreController)

const KeystoreControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'KeystoreController'
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

  useEffect(() => {
    if (!state.keyStoreUid) return

    setUserContext({
      id: getExtensionInstanceId(state.keyStoreUid, mainState?.invite?.verifiedCode || '')
    })
  }, [mainState?.invite?.verifiedCode, state.keyStoreUid])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <KeystoreControllerStateContext.Provider value={memoizedState}>
      {children}
    </KeystoreControllerStateContext.Provider>
  )
}

export { KeystoreControllerStateProvider, KeystoreControllerStateContext }
