import { Contract, JsonRpcProvider } from 'ethers'
import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { ProvidersController } from '@ambire-common/controllers/providers/providers'
import eventBus from '@web/extension-services/event/eventBus'

import { Dispatch } from './useController'

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

export function useProvidersController(
  state: ProvidersController,
  dispatch: Dispatch<'ProvidersController'>
) {
  const callProvider = useCallback(
    async <M extends ProviderMethod>(
      chainId: bigint,
      method: M,
      ...args: MethodArgs<ProviderType, M>
    ): Promise<MethodResult<ProviderType, M>> => {
      const requestId = uuidv4()

      dispatch({
        type: 'method',
        params: {
          method: 'callProviderAndSendResToUi',
          args: [{ requestId, chainId, method, args }]
        }
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
    [dispatch]
  )

  const callContract = useCallback(
    async ({
      address,
      abi,
      chainId,
      method,
      args
    }: {
      address: string
      abi: string
      chainId: bigint
      method: keyof Contract
      args: unknown[]
    }) => {
      const requestId = uuidv4()

      dispatch({
        type: 'method',
        params: {
          method: 'callContractAndSendResToUi',
          args: [{ requestId, chainId, address, abi, method, args }]
        }
      })

      return new Promise<string | undefined>((resolve, reject) => {
        let settled = false

        const cleanup = () => {
          eventBus.removeEventListener('receiveOneTimeData', onResponse)
          clearTimeout(timeoutId)
        }

        const onResponse = (data: any) => {
          if (data?.type !== 'CallContract' || data?.requestId !== requestId) return
          if (settled) return

          settled = true

          cleanup()

          if (data.ok) {
            resolve(data.res as string | undefined)
          } else {
            reject(new Error(data.error ?? `Call Contract.${method.toString()} failed`))
          }
        }

        const timeoutId = setTimeout(() => {
          if (settled) return
          settled = true

          cleanup()
          reject(new Error(`Call Contract.${method.toString()} timed out after 10 seconds`))
        }, 10_000)

        eventBus.addEventListener('receiveOneTimeData', onResponse)
      })
    },
    [dispatch]
  )

  return {
    callProvider,
    callContract
  }
}
