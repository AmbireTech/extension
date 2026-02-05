import { useCallback, useContext, useSyncExternalStore } from 'react'

import { ControllersMiddlewareContext } from '@web/contexts/controllersMiddlewareContext'
import { AnyControllerAction } from '@web/contexts/controllersMiddlewareContext/types'
import { ControllersMappingType } from '@web/extension-services/background/types'

type MethodKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T]

export type ControllerAction<K extends keyof ControllersMappingType> = {
  [M in MethodKeys<ControllersMappingType[K]>]: {
    type: 'method'
    params: {
      ctrlName: K
      method: M
      args: Parameters<Extract<ControllersMappingType[K][M], (...args: any[]) => any>>
    }
  }
}[MethodKeys<ControllersMappingType[K]>]

type HookControllerAction<K extends keyof ControllersMappingType> = {
  [M in MethodKeys<ControllersMappingType[K]>]: {
    type: 'method'
    params: {
      method: M
      args: Parameters<Extract<ControllersMappingType[K][M], (...args: any[]) => any>>
    }
  }
}[MethodKeys<ControllersMappingType[K]>]

interface UseControllerReturn<K extends keyof ControllersMappingType> {
  state: ControllersMappingType[K]
  dispatch: (action: HookControllerAction<K>) => void
}

export default function useController<K extends keyof ControllersMappingType>(
  id: K
): UseControllerReturn<K> {
  const controllersMiddleware = useContext(ControllersMiddlewareContext)

  if (!controllersMiddleware) {
    throw new Error('useController must be used within ControllersMiddlewareProvider')
  }

  const { controllerStore, handleAction } = controllersMiddleware

  const state = useSyncExternalStore(
    useCallback((cb) => controllerStore.subscribe(id as string, cb), [id, controllerStore]),
    useCallback(() => controllerStore.getSnapshot(id), [id, controllerStore])
  ) as ControllersMappingType[K]

  const dispatch = useCallback(
    (action: HookControllerAction<K>) => {
      const ctrlAction = {
        ...action,
        params: { ...action.params, ctrlName: id }
      } as never as AnyControllerAction

      handleAction(ctrlAction)
    },
    [handleAction, id]
  )

  return { state: state || ({} as ControllersMappingType[K]), dispatch }
}
