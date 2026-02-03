/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect, useMemo } from 'react'

import { IEmailVaultController } from '@ambire-common/interfaces/emailVault'
import useControllersMiddleware from '@web/hooks/useControllersMiddleware'
import useControllerState from '@web/hooks/useControllerState'

const EmailVaultControllerStateContext = createContext<IEmailVaultController>(
  {} as IEmailVaultController
)

const EmailVaultControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'EmailVaultController'
  const state = useControllerState(controller)
  const { dispatch } = useControllersMiddleware()

  useEffect(() => {
    dispatch({
      type: 'INIT_CONTROLLER_STATE',
      params: { controller }
    })
  }, [dispatch])

  return (
    <EmailVaultControllerStateContext.Provider value={useMemo(() => state, [state])}>
      {children}
    </EmailVaultControllerStateContext.Provider>
  )
}

export { EmailVaultControllerStateProvider, EmailVaultControllerStateContext }
