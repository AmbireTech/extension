import { Contract, JsonRpcProvider } from 'ethers'
import React, { createContext, useEffect, useMemo } from 'react'

import { IProvidersController } from '@ambire-common/interfaces/provider'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useDeepMemo from '@common/hooks/useDeepMemo'
import useControllerState from '@web/hooks/useControllerState'
import useMainControllerState from '@web/hooks/useMainControllerState'

type AsyncFn = (...args: any[]) => Promise<any>

export type AsyncMethodKeys<T> = {
  [K in keyof T]: T[K] extends AsyncFn ? K : never
}[keyof T]

export type MethodArgs<T, K extends keyof T> = T[K] extends (...args: infer A) => any ? A : never

export type MethodResult<T, K extends keyof T> = T[K] extends (...args: any[]) => Promise<infer R>
  ? R
  : never

export type ProviderType = JsonRpcProvider

export type ProviderMethod = AsyncMethodKeys<ProviderType>

type CallProviderFn = <M extends ProviderMethod>(
  chainId: bigint,
  method: M,
  ...args: MethodArgs<ProviderType, M>
) => Promise<MethodResult<ProviderType, M>>

const ProvidersControllerStateContext = createContext<{
  state: IProvidersController
}>({
  state: {} as IProvidersController
})

const ProvidersControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'ProvidersController'
  const state = useControllerState(controller)
  const { dispatch } = useControllersMiddleware()
  const mainState = useMainControllerState()

  useEffect(() => {
    if (!Object.keys(state).length)
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
  }, [dispatch, mainState.isReady, state])

  const memoizedState = useDeepMemo(state, controller)

  return (
    <ProvidersControllerStateContext.Provider
      value={useMemo(() => ({ state: memoizedState }), [memoizedState])}
    >
      {children}
    </ProvidersControllerStateContext.Provider>
  )
}

export { ProvidersControllerStateProvider, ProvidersControllerStateContext }
