import { JsonRpcProvider } from 'ethers'
import React, { createContext, useCallback, useEffect, useMemo } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { IProvidersController } from '@ambire-common/interfaces/provider'
import useDeepMemo from '@common/hooks/useDeepMemo'
import eventBus from '@web/extension-services/event/eventBus'
import useBackgroundService from '@web/hooks/useBackgroundService'
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
  callProvider: CallProviderFn
}>({
  state: {} as IProvidersController,
  callProvider: () => Promise.resolve(null as any)
})

const ProvidersControllerStateProvider: React.FC<any> = ({ children }) => {
  const controller = 'ProvidersController'
  const state = useControllerState(controller)
  const { dispatch } = useBackgroundService()
  const mainState = useMainControllerState()

  useEffect(() => {
    if (!Object.keys(state).length)
      dispatch({ type: 'INIT_CONTROLLER_STATE', params: { controller } })
  }, [dispatch, mainState.isReady, state])

  const callProvider = useCallback(
    async <M extends ProviderMethod>(
      chainId: bigint,
      method: M,
      ...args: MethodArgs<ProviderType, M>
    ): Promise<MethodResult<ProviderType, M>> => {
      const requestId = uuidv4()

      dispatch({
        type: 'PROVIDERS_CONTROLLER_CALL_PROVIDER_AND_SEND_RES_TO_UI',
        params: { requestId, chainId, method, args }
      })

      return new Promise<MethodResult<ProviderType, M>>((resolve, reject) => {
        let settled = false

        const cleanup = () => {
          eventBus.removeEventListener('receiveOneTimeData', onResponse)
          clearTimeout(timeoutId)
        }

        const onResponse = (data: any) => {
          if (data?.type !== 'RpcCallRes' || data?.requestId !== requestId) return
          if (settled) return

          settled = true

          cleanup()

          if (data.ok) {
            resolve(data.res as MethodResult<ProviderType, M>)
          } else {
            reject(new Error(data.error ?? 'RPC call failed'))
          }
        }

        const timeoutId = setTimeout(() => {
          if (settled) return
          settled = true

          cleanup()
          reject(new Error('RPC call timed out after 10 seconds'))
        }, 10_000)

        eventBus.addEventListener('receiveOneTimeData', onResponse)
      })
    },
    [dispatch, eventBus]
  )

  const memoizedState = useDeepMemo(state, controller)

  return (
    <ProvidersControllerStateContext.Provider
      value={useMemo(() => ({ state: memoizedState, callProvider }), [memoizedState, callProvider])}
    >
      {children}
    </ProvidersControllerStateContext.Provider>
  )
}

export { ProvidersControllerStateProvider, ProvidersControllerStateContext }
