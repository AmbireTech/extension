import { useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react'

import { isDev } from '@common/config/env'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import { ControllerStoreContext } from '@common/contexts/controllerStoreContext'
import { ControllerHelpersMapping } from '@common/contexts/controllerStoreContext/controllerHelpersStore'

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
  helpers: ControllerHelpersMapping[K]
}

type UseControllerReturn<K extends keyof AllControllersMappingType, S> = BaseControllerReturn<
  K,
  S
> &
  (K extends keyof ControllerHelpersMapping ? ControllerHelpersMapping[K] : {})

type DefaultState<K extends keyof AllControllersMappingType> = K extends 'SignAccountOpController'
  ? AllControllersMappingType[K] | null
  : AllControllersMappingType[K]

export default function useStore<K extends keyof AllControllersMappingType>(
  id: K
): UseControllerReturn<K, DefaultState<K>>

export default function useStore<
  K extends keyof AllControllersMappingType,
  S extends keyof AllControllersMappingType[K]
>(id: K, selector: S): UseControllerReturn<K, AllControllersMappingType[K][S]>

export default function useStore<K extends keyof AllControllersMappingType, S>(
  id: K,
  selector?: (state: AllControllersMappingType[K]) => S
): UseControllerReturn<K, S>

export default function useStore<
  K extends keyof AllControllersMappingType,
  S = AllControllersMappingType[K]
>(
  id: K,
  selector?: ((state: AllControllersMappingType[K]) => S) | keyof AllControllersMappingType[K]
): UseControllerReturn<K, S> {
  const {
    controllerStore,
    controllerHelpersStore,
    stateSubscriptionManager,
    helpersSubscriptionManager,
    isStoreReady
  } = useContext(ControllerStoreContext)

  const derivedSelector = useMemo(() => {
    if (typeof selector === 'function') return selector
    if (selector) return (state: any) => state[selector]
    return undefined
  }, [selector])

  const state = useSyncExternalStore(
    useCallback(
      (cb) => stateSubscriptionManager.subscribe(id, cb, controllerStore, derivedSelector),
      [id, controllerStore, derivedSelector, stateSubscriptionManager]
    ),
    useCallback(
      () => stateSubscriptionManager.getSnapshot(id, controllerStore, derivedSelector),
      [id, controllerStore, derivedSelector, stateSubscriptionManager]
    )
  )

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

  let stateToReturn: any = state || {}

  if (id === 'SignAccountOpController' && !derivedSelector) {
    stateToReturn = Object.keys(stateToReturn).length ? stateToReturn : null
  }

  // If selector is present, we return 'state' directly (which is S)
  if (derivedSelector) {
    stateToReturn = state
  }

  return {
    state: stateToReturn,
    helpers
  } as UseControllerReturn<K, S>
}
