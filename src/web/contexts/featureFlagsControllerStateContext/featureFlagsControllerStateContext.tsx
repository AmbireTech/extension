/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useEffect, useMemo } from 'react'

import { IFeatureFlagsController } from '@ambire-common/interfaces/featureFlags'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

const FeatureFlagsControllerStateContext = createContext<IFeatureFlagsController>(
  {} as IFeatureFlagsController
)

const CONTROLLER_NAME = 'FeatureFlagsController'
const FeatureFlagsControllerStateProvider: React.FC<any> = ({ children }) => {
  const state = useControllerState(CONTROLLER_NAME)
  const { dispatch } = useBackgroundService()
  const mainState = useMainControllerState()

  useEffect(() => {
    if (mainState.isReady && !Object.keys(state).length) {
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller: CONTROLLER_NAME } })
    }
  }, [dispatch, mainState.isReady, state])

  return (
    <FeatureFlagsControllerStateContext.Provider value={useMemo(() => state, [state])}>
      {children}
    </FeatureFlagsControllerStateContext.Provider>
  )
}

export { FeatureFlagsControllerStateProvider, FeatureFlagsControllerStateContext }
