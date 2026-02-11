import { useCallback, useEffect, useSyncExternalStore } from 'react'

import { setExtraContext } from '@common/config/analytics/CrashAnalytics'
import { ControllerStore } from '@common/contexts/controllersMiddlewareContext/controllerStore'

export default function useSelectedAccountControllerHelpers(controllerStore: ControllerStore) {
  const state = useSyncExternalStore(
    useCallback(
      (cb) => controllerStore.subscribe('SelectedAccountController', cb),
      [controllerStore]
    ),
    useCallback(() => controllerStore.getSnapshot('SelectedAccountController'), [controllerStore])
  )

  useEffect(() => {
    if (!state.account?.addr) return

    setExtraContext('address', state.account.addr)
  }, [state.account?.addr])
}
