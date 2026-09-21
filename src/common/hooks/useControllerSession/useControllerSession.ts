import { useEffect, useRef } from 'react'

import { useScreenFocusStore } from '@common/contexts/screenFocusContext'

interface Props {
  /** Whether the session should exist at all - for a screen that opens it conditionally. */
  isEnabled?: boolean
  /**
   * Reopens the session when it changes, for a session opened with arguments.
   * Compared by identity, so it has to be a primitive.
   */
  reopenOn?: string | number | boolean
  open: () => void
  close: () => void
}

/**
 * Ties a controller-side session to its screen being the one the user is on, rather
 * than to that screen being mounted: on mobile the screens below the top one stay
 * mounted, so a session closed on unmount keeps the controller working for a screen
 * nobody is looking at. In the extension sessions die with the UI port (see
 * `handleCleanUpOnPortDisconnect`) and every mounted screen is focused, so there this
 * is open-on-mount / close-on-unmount.
 *
 * `open` and `close` are read through refs, so they need no memoization.
 */
const useControllerSession = ({ isEnabled = true, reopenOn, open, close }: Props) => {
  const screenFocus = useScreenFocusStore()
  const openRef = useRef(open)
  const closeRef = useRef(close)

  // Declared first, so a reopen always calls what the latest render passed.
  useEffect(() => {
    openRef.current = open
    closeRef.current = close
  }, [close, open])

  // Focus is listened to, not rendered from: these screens are the heavy ones, and a
  // re-render as they lose focus lands in the commit that starts the transition.
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
