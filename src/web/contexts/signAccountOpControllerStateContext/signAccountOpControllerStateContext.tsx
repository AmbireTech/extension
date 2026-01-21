import React, { createContext, useEffect, useState } from 'react'
import { flushSync } from 'react-dom'

import { ISignAccountOpController } from '@ambire-common/interfaces/signAccountOp'
import useDeepMemo from '@common/hooks/useDeepMemo'
import eventBus from '@web/extension-services/event/eventBus'
import useBackgroundService from '@web/hooks/useBackgroundService'

const SignAccountOpControllerStateContext = createContext<ISignAccountOpController | null>(null)

const SignAccountOpControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'signAccountOp'
  const [state, setState] = useState<ISignAccountOpController | null>(null)
  const { dispatch } = useBackgroundService()

  useEffect(() => {
    dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
  }, [dispatch])

  useEffect(() => {
    const onUpdate = (newState: ISignAccountOpController | null, forceEmit?: boolean) => {
      if (forceEmit) {
        flushSync(() => setState(newState))
      } else {
        setState(newState)
      }
    }

    eventBus.addEventListener('signAccountOp', onUpdate)

    return () => eventBus.removeEventListener('signAccountOp', onUpdate)
  }, [])

  const memoizedState = useDeepMemo(state, 'signAccountOp')

  return (
    <SignAccountOpControllerStateContext.Provider value={memoizedState}>
      {children}
    </SignAccountOpControllerStateContext.Provider>
  )
}

export { SignAccountOpControllerStateProvider, SignAccountOpControllerStateContext }
