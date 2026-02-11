import { useCallback, useContext, useSyncExternalStore } from 'react'

import { AllControllersMappingType } from '@common/constants/controllersMapping'
import { ControllersMiddlewareContext } from '@common/contexts/controllersMiddlewareContext/controllersMiddlewareContext'
import { ControllerHelpersStore } from '@common/contexts/controllerStoreContext/controllerHelpersStore'
import { ControllerStore } from '@common/contexts/controllerStoreContext/controllerStore'

export default function useStore<K extends keyof AllControllersMappingType>(
  store: ControllerStore | ControllerHelpersStore,
  id: K
) {
  const state = useSyncExternalStore(
    useCallback((cb) => store.subscribe(id, cb), [id, store]),
    useCallback(() => store.getSnapshot(id), [id, store])
  ) as AllControllersMappingType[K]

  return state
}
