/* eslint-disable @typescript-eslint/no-shadow */
import React, { createContext, useCallback, useEffect, useMemo } from 'react'

import { IDomainsController } from '@ambire-common/interfaces/domains'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useControllersMiddleware from '@web/hooks/useControllersMiddleware'
import useControllerState from '@web/hooks/useControllerState'

const DomainsControllerStateContext = createContext<{
  state: IDomainsController
  reverseLookup: (address: string) => void
  resolveDomain: (props: { domain: string; bip44Item?: number[][] }) => void
}>({
  state: {} as IDomainsController,
  reverseLookup: () => {},
  resolveDomain: () => {}
})

const ExtensionDomainsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const controller = 'DomainsController'
  const state = useControllerState(controller)
  const { dispatch } = useControllersMiddleware()

  useEffect(() => {
    if (!Object.keys(state).length) {
      dispatch({
        type: 'INIT_CONTROLLER_STATE',
        params: { controller }
      })
    }
  }, [dispatch, state])

  const memoizedState = useDeepMemo(state, controller)

  const reverseLookup = useCallback(
    (address: string) => {
      dispatch({ type: 'DOMAINS_CONTROLLER_REVERSE_LOOKUP', params: { address } })
    },
    [dispatch]
  )

  const resolveDomain = useCallback(
    (props: { domain: string; bip44Item?: number[][] }) => {
      dispatch({
        type: 'DOMAINS_CONTROLLER_RESOLVE_DOMAIN',
        params: props
      })
    },
    [dispatch]
  )

  return (
    <DomainsControllerStateContext.Provider
      value={useMemo(
        () => ({ state: memoizedState, reverseLookup, resolveDomain }),
        [memoizedState, reverseLookup, resolveDomain]
      )}
    >
      {children}
    </DomainsControllerStateContext.Provider>
  )
}

const DomainsControllerStateProvider: React.FC<React.PropsWithChildren> = (props) => {
  return <ExtensionDomainsProvider {...props} />
}

export { DomainsControllerStateProvider, DomainsControllerStateContext }
