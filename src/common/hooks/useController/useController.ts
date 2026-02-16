import { useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react'
import { v4 as uuidv4 } from 'uuid'

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

interface BaseControllerReturn<K extends keyof AllControllersMappingType, S> {
  /**
   * We have to handle SignAccountOpController separately because it can be null
   * because it is a dynamic controller that exists only when a window with sign
   * request is open.
   *
   * Rest of the controllers are static and exist in the controllerStore from the start
   * and once isStoreReady is true, we can be sure that their states are initialized.
   */
  state: S
  dispatch: Dispatch<K>
  dispatchAndWait: DispatchAndWait<K>
}

type UseControllerReturn<K extends keyof AllControllersMappingType, S> = BaseControllerReturn<
  K,
  S
> &
  (K extends keyof ControllerHelpersMapping ? ControllerHelpersMapping[K] : {})

type DefaultState<K extends keyof AllControllersMappingType> = K extends 'SignAccountOpController'
  ? AllControllersMappingType[K] | null
  : AllControllersMappingType[K]

export default function useController<K extends keyof AllControllersMappingType>(
  id: K
): UseControllerReturn<K, DefaultState<K>>

export default function useController<K extends keyof AllControllersMappingType, S>(
  id: K,
  selector: (state: AllControllersMappingType[K]) => S
): UseControllerReturn<K, S>

export default function useController<
  K extends keyof AllControllersMappingType,
  S = AllControllersMappingType[K]
>(id: K, selector?: (state: AllControllersMappingType[K]) => S): UseControllerReturn<K, S> {
  const controllersMiddleware = useContext(ControllersMiddlewareContext)

  if (!controllersMiddleware) {
    throw new Error('useController must be used within ControllersMiddlewareProvider')
  }

  const {
    controllerStore,
    controllerHelpersStore,
    stateSubscriptionManager,
    helpersSubscriptionManager,
    isStoreReady
  } = useControllerStore()
  const { dispatch: controllersMiddlewareDispatch } = controllersMiddleware

  // Create the error object here to capture the stack trace of the call site (the component using this hook)
  const missingControllerError = useMemo(() => {
    return new Error(`A controller with name ${id} does not exist in the controllerStore.`)
  }, [id])

  useEffect(() => {
    if (id === 'SignAccountOpController') return

    if (isStoreReady && !Object.keys(controllerStore.getSnapshot(id)).length) {
      if (isDev) console.warn(missingControllerError)
    }
  }, [controllerStore, id, isStoreReady, missingControllerError])

  const state = useSyncExternalStore(
    useCallback(
      (cb) => stateSubscriptionManager.subscribe(id, cb, controllerStore, selector),
      [id, controllerStore, selector, stateSubscriptionManager]
    ),
    useCallback(
      () => stateSubscriptionManager.getSnapshot(id, controllerStore, selector),
      [id, controllerStore, selector, stateSubscriptionManager]
    )
  ) as S

  const helpers = useSyncExternalStore(
    useCallback(
      (cb) => helpersSubscriptionManager.subscribe(id, cb, controllerHelpersStore),
      [id, controllerHelpersStore, helpersSubscriptionManager]
    ),
    useCallback(
      () => helpersSubscriptionManager.getSnapshot(id, controllerHelpersStore),
      [id, controllerHelpersStore, helpersSubscriptionManager]
    )
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

  let stateToReturn: any = state || {}

  if (id === 'SignAccountOpController' && !selector) {
    stateToReturn = Object.keys(stateToReturn).length ? stateToReturn : null
  }

  // If selector is present, we return 'state' directly (which is S)
  if (selector) {
    stateToReturn = state
  }

  return {
    state: stateToReturn,
    ...(helpers || ({} as ControllerHelpersMapping[K])),
    dispatch,
    dispatchAndWait
  } as UseControllerReturn<K, S>
}
