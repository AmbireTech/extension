import React, { createContext, useEffect, useMemo } from 'react'

import { ExtensionUpdateController } from '@web/extension-services/background/controllers/extension-update'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'

const ExtensionUpdateControllerStateContext = createContext<ExtensionUpdateController>(
  {} as ExtensionUpdateController
)

const ExtensionUpdateControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'ExtensionUpdateController'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()

  useEffect(() => {
    dispatch({
      type: 'INIT_CONTROLLER_STATE',
      params: { controller }
    })
  }, [dispatch])

  return (
    <ExtensionUpdateControllerStateContext.Provider value={useMemo(() => state, [state])}>
      {children}
    </ExtensionUpdateControllerStateContext.Provider>
  )
}

export { ExtensionUpdateControllerStateProvider, ExtensionUpdateControllerStateContext }
