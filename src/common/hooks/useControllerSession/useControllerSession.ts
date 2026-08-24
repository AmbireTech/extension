import { useEffect, useRef } from 'react'

import { useIsScreenFocused } from '@common/contexts/screenFocusContext'

interface Props {
  /** Whether the session should exist at all - for a screen that opens it conditionally. */
  isEnabled?: boolean
  open: () => void
  close: () => void
}

/**
 * Ties a controller-side session to the screen that owns it being the one the user is
 * on, rather than to that screen being mounted.
 *
 * On mobile the screens below the top one stay mounted and are frozen, and a frozen
 * screen's effect cleanups never run - so a session closed on unmount outlives its
 * screen for as long as the user is somewhere else, and the controller keeps working
 * for a screen nobody is looking at. The extension does not have that problem, because
 * its sessions die with the UI port (see `handleCleanUpOnPortDisconnect`), and there
 * every mounted screen is the focused one - so this behaves exactly like the
 * open-on-mount / close-on-unmount it replaces.
 *
 * `open` and `close` need not be memoized: they are read through refs, so a screen that
 * rebuilds them on every render - writing the session id into the search params is
 * enough to do that - cannot reopen its session on every render.
 */
const useControllerSession = ({ isEnabled = true, open, close }: Props) => {
  const isScreenFocused = useIsScreenFocused()
  const shouldBeOpen = isEnabled && isScreenFocused
  const openRef = useRef(open)
  const closeRef = useRef(close)

  // Declared before the effect that opens the session, so that by the time a reopen
  // runs, the refs hold what the latest render passed.
  useEffect(() => {
    openRef.current = open
    closeRef.current = close
  }, [close, open])

  useEffect(() => {
    if (!shouldBeOpen) return undefined

    openRef.current()

    return () => closeRef.current()
  }, [shouldBeOpen])
}

export default useControllerSession
