/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect } from 'react'

import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useDeepMemo from '@common/hooks/useDeepMemo'
import { WalletStateController } from '@web/extension-services/background/controllers/wallet-state'
import useControllerState from '@web/hooks/useControllerState'

const WalletStateControllerContext = createContext<WalletStateController>(
  {} as WalletStateController
)

const WalletStateControllerProvider: React.FC<any> = ({ children }) => {
  const controller = 'WalletStateController'
  const state = useControllerState(controller)
  const { dispatch } = useControllersMiddleware()

  useEffect(() => {
    dispatch({
      type: 'INIT_CONTROLLER_STATE',
      params: { controller }
    })
  }, [dispatch])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <WalletStateControllerContext.Provider value={memoizedState}>
      {children}
    </WalletStateControllerContext.Provider>
  )
}

export { WalletStateControllerProvider, WalletStateControllerContext }
