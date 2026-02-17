import { useEffect, useMemo } from 'react'
import { useIdleTimer } from 'react-idle-timer'

import useControllerState from '@common/hooks/useControllerState'
import { Action } from '@web/extension-services/background/actions'

export default function useAutoLockControllerHelpers(dispatch: (action: Action) => void) {
  const { state } = useControllerState({ id: 'AutoLockController' })

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
