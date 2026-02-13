import { useCallback, useContext, useEffect, useSyncExternalStore } from 'react'
import { v4 as uuidv4 } from 'uuid'

import { captureException } from '@common/config/analytics/CrashAnalytics'
import { isDev } from '@common/config/env'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext/controllersMiddlewareContext'
import { AnyControllerAction } from '@common/contexts/controllersMiddlewareContext/types'
import { ControllerHelpersMapping } from '@common/contexts/controllerStoreContext/controllerHelpersStore'
import useControllerStore from '@common/hooks/useControllerStore'
import eventBus from '@web/extension-services/event/eventBus'

type MethodKeys<T> = {
  [K in keyof T]-?: T[K] extends (...args: any[]) => any ? K : never
}[keyof T]

type DropLast<T extends any[]> = T extends [...infer U, any] ? U : T

export type ControllerAction<K extends keyof AllControllersMappingType> = {
  [M in MethodKeys<AllControllersMappingType[K]>]: {
    type: 'method'
    params: {
      ctrlName: K
      method: M
      args: Parameters<Extract<AllControllersMappingType[K][M], (...args: any[]) => any>>
    }
  }
}[MethodKeys<AllControllersMappingType[K]>]

type HookControllerAction<K extends keyof AllControllersMappingType> = {
  [M in MethodKeys<AllControllersMappingType[K]>]: {
    type: 'method'
    params: {
      method: M
      args: Parameters<Extract<AllControllersMappingType[K][M], (...args: any[]) => any>>
    }
  }
}[MethodKeys<AllControllersMappingType[K]>]

export type Dispatch<K extends keyof AllControllersMappingType> = (
  action: HookControllerAction<K>
) => void

export type DispatchAndWait<K extends keyof AllControllersMappingType> = <
  M extends MethodKeys<AllControllersMappingType[K]>,
  R = any
>(action: {
  type: 'method'
  params: {
    method: M
    args: DropLast<Parameters<Extract<AllControllersMappingType[K][M], (...args: any[]) => any>>>
  }
}) => Promise<R>

interface BaseControllerReturn<K extends keyof AllControllersMappingType> {
  state: AllControllersMappingType[K]
  dispatch: Dispatch<K>
  dispatchAndWait: DispatchAndWait<K>
}

type UseControllerReturn<K extends keyof AllControllersMappingType> = BaseControllerReturn<K> &
  (K extends keyof ControllerHelpersMapping ? ControllerHelpersMapping[K] : {})

export default function useController<K extends keyof AllControllersMappingType>(
  id: K
): UseControllerReturn<K> {
  const controllersMiddleware = useContext(ControllersMiddlewareContext)

  if (!controllersMiddleware) {
    throw new Error('useController must be used within ControllersMiddlewareProvider')
  }

  const { controllerStore, controllerHelpersStore, isStoreReady } = useControllerStore()
  const { dispatch: controllersMiddlewareDispatch } = controllersMiddleware

  useEffect(() => {
    if (isStoreReady && !Object.keys(controllerStore.getSnapshot(id)).length) {
      const error = new Error(`A controller with name ${id} does not exist in the controllerStore.`)
      if (isDev) {
        throw error
      } else {
        captureException(error)
      }
    }
  }, [controllerStore, id, isStoreReady])

  const state = useSyncExternalStore(
    useCallback((cb) => controllerStore.subscribe(id, cb), [id, controllerStore]),
    useCallback(() => controllerStore.getSnapshot(id), [id, controllerStore])
  ) as AllControllersMappingType[K]

  const helpers = useSyncExternalStore(
    useCallback((cb) => controllerHelpersStore.subscribe(id, cb), [id, controllerHelpersStore]),
    useCallback(() => controllerHelpersStore.getSnapshot(id), [id, controllerHelpersStore])
  )

  const dispatch = useCallback(
    (action: HookControllerAction<K>) => {
      const ctrlAction = {
        ...action,
        params: { ...action.params, ctrlName: id }
      } as never as AnyControllerAction

      controllersMiddlewareDispatch(ctrlAction as any)
    },
    [controllersMiddlewareDispatch, id]
  )

  const dispatchAndWait = useCallback(
    <M extends MethodKeys<AllControllersMappingType[K]>, R = any>(action: {
      type: 'method'
      params: {
        method: M
        args: DropLast<
          Parameters<Extract<AllControllersMappingType[K][M], (...args: any[]) => any>>
        >
      }
    }) => {
      const requestId = uuidv4()

      const ctrlAction = {
        ...action,
        params: { ...action.params, ctrlName: id, args: [...action.params.args, requestId] }
      } as never as AnyControllerAction
      controllersMiddlewareDispatch(ctrlAction as any)

      return new Promise<R>((resolve, reject) => {
        let settled = false

        const cleanup = () => {
          eventBus.removeEventListener('receiveOneTimeData', onResponse)
          clearTimeout(timeoutId)
        }

        const onResponse = (data: any) => {
          if (data?.requestId !== requestId) return
          if (settled) return

          settled = true

          cleanup()

          if (data.ok) {
            resolve(data.res as R)
          } else {
            reject(new Error(data.error ?? `Calling ${id}.${ctrlAction.params.method} failed`))
          }
        }

        const timeoutId = setTimeout(() => {
          if (settled) return
          settled = true

          cleanup()
          reject(new Error(`Calling ${id}.${ctrlAction.params.method} timed out after 10 seconds`))
        }, 10_000)

        eventBus.addEventListener('receiveOneTimeData', onResponse)
      })
    },
    [controllersMiddlewareDispatch, id]
  )

  return {
    state: state || ({} as AllControllersMappingType[K]),
    ...(helpers || ({} as ControllerHelpersMapping[K])),
    dispatch,
    dispatchAndWait
  } as UseControllerReturn<K>
}
