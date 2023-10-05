/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect, useMemo, useState } from 'react'

import { SignAccountOpController } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import eventBus from '@web/extension-services/event/eventBus'
import useBackgroundService from '@web/hooks/useBackgroundService'

const SignAccountOpControllerStateContext = createContext<SignAccountOpController>(
  {} as SignAccountOpController
)

const SignAccountOpControllerStateProvider: React.FC<any> = ({ children }) => {
  const [state, setState] = useState({} as SignAccountOpController)
  const { dispatch } = useBackgroundService()

  useEffect(() => {
    dispatch({
      type: 'INIT_CONTROLLER_STATE',
      params: { controller: 'signAccountOp' }
    })
  }, [dispatch])

  useEffect(() => {
    const onUpdate = (newState: SignAccountOpController) => {
      setState(newState)
    }

    eventBus.addEventListener('signAccountOp', onUpdate)

    return () => eventBus.removeEventListener('signAccountOp', onUpdate)
  }, [])

  return (
    <SignAccountOpControllerStateContext.Provider value={useMemo(() => state, [state])}>
      {children}
    </SignAccountOpControllerStateContext.Provider>
  )
}

export { SignAccountOpControllerStateProvider, SignAccountOpControllerStateContext }
