import { useEffect, useRef } from 'react'

import { useScreenFocusStore } from '@common/contexts/screenFocusContext'

interface Props {
  /** Whether the session should exist at all - for a screen that opens it conditionally. */
  isEnabled?: boolean
  /**
   * Reopens the session when it changes - for a session that is opened with
   * arguments, so that the controller is asked again when they are no longer the
   * ones it was asked with. Compared by identity, so it has to be a primitive.
   */
  reopenOn?: string | number | boolean
  open: () => void
  close: () => void
}

/**
 * Ties a controller-side session to the screen that owns it being the one the user is
 * on, rather than to that screen being mounted.
 *
 * On mobile the screens below the top one stay mounted, so a session closed on unmount
 * outlives its screen for as long as the user is somewhere else, and the controller
 * keeps working for a screen nobody is looking at. The extension does not have that problem, because
 * its sessions die with the UI port (see `handleCleanUpOnPortDisconnect`), and there
 * every mounted screen is the focused one - so this behaves exactly like the
 * open-on-mount / close-on-unmount it replaces.
 *
 * `open` and `close` need not be memoized: they are read through refs, so a screen that
 * rebuilds them on every render - writing the session id into the search params is
 * enough to do that - cannot reopen its session on every render.
 */
const useControllerSession = ({ isEnabled = true, reopenOn, open, close }: Props) => {
  const screenFocus = useScreenFocusStore()
  const openRef = useRef(open)
  const closeRef = useRef(close)

  // Declared before the effect that opens the session, so that by the time a reopen
  // runs, the refs hold what the latest render passed.
  useEffect(() => {
    openRef.current = open
    closeRef.current = close
  }, [close, open])

  // Focus is listened to rather than rendered from: the screens that own a session
  // are the heavy ones, and re-rendering them as they lose focus lands in the commit
  // that starts the transition away from them.
  useEffect(() => {
    if (!isEnabled) return undefined

    let isOpen = false

    const syncWithFocus = () => {
      if (screenFocus.isFocused.current === isOpen) return

      isOpen = screenFocus.isFocused.current
      if (isOpen) openRef.current()
      else closeRef.current()
    }

    syncWithFocus()
    const unsubscribe = screenFocus.subscribe(syncWithFocus)

    return () => {
      unsubscribe()
      if (isOpen) closeRef.current()
    }
  }, [isEnabled, reopenOn, screenFocus])
}

export default useControllerSession
