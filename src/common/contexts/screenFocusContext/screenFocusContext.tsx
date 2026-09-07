import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react'

// True by default: the extension and the websites render one route at a time, so
// whatever is mounted there is the focused screen.
const ScreenFocusContext = createContext(true)

/**
 * Focus to read and to listen to, never to render from: the object's identity never
 * changes, so gaining or losing focus re-renders nothing. What a screen left behind
 * renders is paid in the commit that starts the transition to the next one.
 */
export type ScreenFocusStore = {
  /** Readable from handlers and effects without subscribing to it. */
  isFocused: { current: boolean }
  /** Notified after `isFocused` has changed. */
  subscribe: (listener: () => void) => () => void
}

const createScreenFocusStore = (
  isFocused: boolean
): ScreenFocusStore & {
  setIsFocused: (next: boolean) => void
  notify: () => void
} => {
  const ref = { current: isFocused }
  const listeners = new Set<() => void>()

  return {
    isFocused: ref,
    setIsFocused: (next: boolean) => {
      ref.current = next
    },
    notify: () => listeners.forEach((listener) => listener()),
    subscribe: (listener: () => void) => {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    }
  }
}

const ALWAYS_FOCUSED_STORE = createScreenFocusStore(true)

const ScreenFocusStoreContext = createContext<ScreenFocusStore>(ALWAYS_FOCUSED_STORE)

/**
 * Marks its subtree as the screen the user is on. The mobile stack keeps the screens
 * below the top one mounted, so anything that may only run while its screen is
 * visible - a camera, a redirect, a poll - has to ask rather than assume.
 */
const ScreenFocusProvider = ({
  isFocused,
  isSettled = true,
  children
}: {
  isFocused: boolean
  /**
   * Whether the platform has finished transitioning to this screen. Only the stack
   * knows it; everywhere else a screen is there as soon as it renders.
   */
  isSettled?: boolean
  children: React.ReactNode
}) => {
  const [store] = useState(() => createScreenFocusStore(isFocused))

  // Set on commit, never during render: a render React discards would leave a stale
  // flag behind, and every navigation from the screen would then be refused.
  useLayoutEffect(() => {
    store.setIsFocused(isFocused)
  }, [isFocused, store])

  // Focus gained is announced once the transition ends, because catching up re-renders
  // the whole screen. Focus lost is announced at once, since it only stops work.
  const shouldNotify = !isFocused || isSettled

  useEffect(() => {
    if (!shouldNotify) return

    store.notify()
  }, [isFocused, shouldNotify, store])

  return (
    <ScreenFocusStoreContext.Provider value={store}>
      <ScreenFocusContext.Provider value={isFocused}>{children}</ScreenFocusContext.Provider>
    </ScreenFocusStoreContext.Provider>
  )
}

/** Re-renders the component when its screen gains or loses focus. */
const useIsScreenFocused = () => useContext(ScreenFocusContext)

/** Reads focus without subscribing to it - for handlers and effects. */
const useIsScreenFocusedRef = () => useContext(ScreenFocusStoreContext).isFocused

/** Focus as a store, for code that reacts to a change on its own. */
const useScreenFocusStore = () => useContext(ScreenFocusStoreContext)

export { ScreenFocusProvider, useIsScreenFocused, useIsScreenFocusedRef, useScreenFocusStore }
