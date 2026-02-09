import { useCallback, useContext, useEffect, useSyncExternalStore } from 'react'

import { ProvidersController } from '@ambire-common/controllers/providers/providers'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext/context'
import { AnyControllerAction } from '@common/contexts/controllersMiddlewareContext/types'
import AutoLockController from '@web/extension-services/background/controllers/auto-lock'

import { useAutoLockController } from './autoLock'
import { useKeystoreController } from './keystore'
import { useProvidersController } from './providers'

type MethodKeys<T> = {
  [K in keyof T]-?: T[K] extends (...args: any[]) => any ? K : never
}[keyof T]

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

interface BaseControllerReturn<K extends keyof AllControllersMappingType> {
  state: AllControllersMappingType[K]
  dispatch: Dispatch<K>
}

interface ControllerLogicRegistry {
  ProvidersController: ReturnType<typeof useProvidersController>
  // PortfolioController: ReturnType<typeof usePortfolioController>
  // ...
  // ...
}

type UseControllerReturn<K extends keyof AllControllersMappingType> = BaseControllerReturn<K> &
  (K extends keyof ControllerLogicRegistry ? ControllerLogicRegistry[K] : {})

export default function useController<K extends keyof AllControllersMappingType>(
  id: K
): UseControllerReturn<K> {
  const controllersMiddleware = useContext(ControllersMiddlewareContext)

  if (!controllersMiddleware) {
    throw new Error('useController must be used within ControllersMiddlewareProvider')
  }

  const {
    controllerStore,
    isStoreReady,
    dispatch: controllersMiddlewareDispatch
  } = controllersMiddleware

  useEffect(() => {
    if (isStoreReady && !Object.keys(controllerStore.getSnapshot(id)).length) {
      throw new Error(`A controller with name ${id} does not exist in the controllerStore.`)
    }
  }, [controllerStore, id, isStoreReady])

  const state = useSyncExternalStore(
    useCallback((cb) => controllerStore.subscribe(id as string, cb), [id, controllerStore]),
    useCallback(() => controllerStore.getSnapshot(id), [id, controllerStore])
  ) as AllControllersMappingType[K]

  const dispatch = useCallback(
    (action: HookControllerAction<K>) => {
      const ctrlAction = {
        ...action,
        params: { ...action.params, ctrlName: id }
      } as never as AnyControllerAction

      controllersMiddlewareDispatch(ctrlAction)
    },
    [controllersMiddlewareDispatch, id]
  )

  let ctrlSpecificMethods = {}

  if (id === 'ProvidersController') {
    const providersLogic = useProvidersController(
      state as ProvidersController,
      dispatch as unknown as Dispatch<'ProvidersController'>
    )
    ctrlSpecificMethods = providersLogic
  }

  if (id === 'AutoLockController') {
    useAutoLockController(
      state as AutoLockController,
      dispatch as unknown as Dispatch<'AutoLockController'>
    )
  }

  if (id === 'DappsController') {
    // TODO:
  }

  if (id === 'KeystoreController' || id === 'MainController') {
    useKeystoreController(
      controllerStore.getSnapshot('KeystoreController'),
      controllerStore.getSnapshot('MainController')
    )
  }

  if (id === 'RequestsController') {
    // TODO:
  }

  if (id === 'SelectedAccountController') {
    // TODO:
  }

  return {
    state: state || ({} as AllControllersMappingType[K]),
    dispatch,
    ...ctrlSpecificMethods
  } as UseControllerReturn<K>
}
