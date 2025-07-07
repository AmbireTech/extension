/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect } from 'react'

import { KeystoreController } from '@ambire-common/controllers/keystore/keystore'
import { setUserContext } from '@common/config/analytics/CrashAnalytics.web'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'
import { getExtensionInstanceId } from '@web/utils/analytics'

const KeystoreControllerStateContext = createContext<KeystoreController>({} as KeystoreController)

const KeystoreControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'keystore'
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
      id: getExtensionInstanceId(state.keyStoreUid)
    })
  }, [state.keyStoreUid])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <KeystoreControllerStateContext.Provider value={memoizedState}>
      {children}
    </KeystoreControllerStateContext.Provider>
  )
}

export { KeystoreControllerStateProvider, KeystoreControllerStateContext }
