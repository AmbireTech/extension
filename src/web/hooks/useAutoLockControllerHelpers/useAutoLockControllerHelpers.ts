import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'
import { useIdleTimer } from 'react-idle-timer'

import { ControllerStore } from '@common/contexts/controllerStoreContext/controllerStore'
import { Action } from '@web/extension-services/background/actions'

export default function useAutoLockControllerHelpers(
  controllerStore: ControllerStore,
  dispatch: (action: Action) => void
) {
  const state = useSyncExternalStore(
    useCallback((cb) => controllerStore.subscribe('AutoLockController', cb), [controllerStore]),
    useCallback(() => controllerStore.getSnapshot('AutoLockController'), [controllerStore])
  )

  const autoLockTime = useMemo(() => state.autoLockTime, [state.autoLockTime])

  useEffect(() => {
    // reset lock timer on window open
    dispatch({
      type: 'method',
      params: { ctrlName: 'AutoLockController', method: 'setLastActiveTime', args: [] }
    })
  }, [dispatch])

  useIdleTimer({
    onAction(e) {
      if (!e) return

      if (['mousedown', 'mousemove'].includes(e.type) && (autoLockTime || 0) > 0) {
        // reset lock timer on mouse click or mouse move (user is active)
        dispatch({
          type: 'method',
          params: { ctrlName: 'AutoLockController', method: 'setLastActiveTime', args: [] }
        })
      }
    },
    throttle: 5000
  })
}
