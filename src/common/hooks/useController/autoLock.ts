import { useEffect } from 'react'
import { useIdleTimer } from 'react-idle-timer'

import AutoLockController from '@web/extension-services/background/controllers/auto-lock'

import { Dispatch } from './useController'

export function useAutoLockController(
  state: AutoLockController,
  dispatch: Dispatch<'AutoLockController'>
) {
  useEffect(() => {
    // reset lock timer on window open
    dispatch({ type: 'method', params: { method: 'setLastActiveTime', args: [] } })
  }, [dispatch])

  useIdleTimer({
    onAction(e) {
      if (!e) return

      if (['mousedown', 'mousemove'].includes(e.type) && (state?.autoLockTime || 0) > 0) {
        // reset lock timer on mouse click or mouse move (user is active)
        dispatch({ type: 'method', params: { method: 'setLastActiveTime', args: [] } })
      }
    },
    throttle: 5000
  })
}
