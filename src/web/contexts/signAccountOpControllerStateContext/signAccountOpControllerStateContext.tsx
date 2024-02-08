import React, { createContext, useEffect, useMemo, useState } from 'react'

import { SignAccountOpController } from '@ambire-common/controllers/signAccountOp/signAccountOp'
import eventBus from '@web/extension-services/event/eventBus'

const SignAccountOpControllerStateContext = createContext<SignAccountOpController | null>(null)

const SignAccountOpControllerStateProvider: React.FC<any> = ({ children }) => {
  const [state, setState] = useState<SignAccountOpController | null>(null)

  useEffect(() => {
    const onUpdate = (newState: SignAccountOpController | null) => {
      console.log('newState', newState)
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
