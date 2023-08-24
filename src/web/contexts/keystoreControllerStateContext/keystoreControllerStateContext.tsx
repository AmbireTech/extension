import { KeystoreController } from 'ambire-common/src/controllers/keystore/keystore'
/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect, useMemo, useState } from 'react'

import eventBus from '@web/extension-services/event/eventBus'
import useBackgroundService from '@web/hooks/useBackgroundService'

const KeystoreControllerStateContext = createContext<KeystoreController>({} as KeystoreController)

const KeystoreControllerStateProvider: React.FC<any> = ({ children }) => {
  const [state, setState] = useState({} as KeystoreController)
  const { dispatch } = useBackgroundService()

  useEffect(() => {
    dispatch({
      type: 'INIT_CONTROLLER_STATE',
      params: { controller: 'keystore' }
    })
  }, [dispatch])

  useEffect(() => {
    const onUpdate = (newState: KeystoreController) => {
      setState(newState)
    }

    eventBus.addEventListener('keystore', onUpdate)

    return () => eventBus.removeEventListener('keystore', onUpdate)
  }, [])

  return (
    <KeystoreControllerStateContext.Provider value={useMemo(() => state, [state])}>
      {children}
    </KeystoreControllerStateContext.Provider>
  )
}

export { KeystoreControllerStateProvider, KeystoreControllerStateContext }
