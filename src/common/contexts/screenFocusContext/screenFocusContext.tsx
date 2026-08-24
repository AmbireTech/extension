import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react'

// True by default: the extension and the standalone websites render one route at
// a time, so whatever is mounted there is always the focused screen.
const ScreenFocusContext = createContext(true)

/**
 * Focus as something to read and to listen to, rather than to render from.
 * Handed out as one object whose identity never changes, so the screen does not
 * re-render when it gains or loses focus - a screen left behind by a transition
 * renders in the same commit as the screen coming in, and delays it from
 * starting.
 */
export type ScreenFocusStore = {
  /** Read when something happens, so reading it costs no subscription. */
  isFocused: { current: boolean }
  /** Called after focus changed, with the ref already holding the new value. */
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
 * Marks its subtree as the screen the user is on. The mobile navigation stack
 * keeps the screens below the top one mounted, so anything that must only run
 * while its screen is actually visible - a camera, a redirect, a poll - has to
 * ask instead of assuming that being mounted is enough.
 */
const ScreenFocusProvider = ({
  isFocused,
  isSettled = true,
  children
}: {
  isFocused: boolean
  /**
   * Whether the platform has finished transitioning to this screen. Only the
   * navigation stack knows, and only it passes it - everywhere else a screen is
   * there as soon as it renders.
   */
  isSettled?: boolean
  children: React.ReactNode
}) => {
  const [store] = useState(() => createScreenFocusStore(isFocused))

  // Written on commit rather than while rendering: React renders a low priority
  // update on the tree as it was last committed, so a render it throws away would
  // leave the flag saying the screen is not the one the user is on - and every
  // navigation from it would be refused. Committed before the effects of the same
  // render, so a screen's own effect already reads the focus it has just gained.
  useLayoutEffect(() => {
    store.setIsFocused(isFocused)
  }, [isFocused, store])

  // A screen gaining focus is told once the transition to it is over: catching up
  // on the state it stopped subscribing to while it was away is a render of the
  // whole screen, and it would otherwise be paid before the transition that
  // brings it back can even start. Losing focus is reported right away - it only
  // takes work away.
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

/** Reads focus without subscribing to it - for event handlers and effects. */
const useIsScreenFocusedRef = () => useContext(ScreenFocusStoreContext).isFocused

/** Focus as a store, for code that has its own way of reacting to a change. */
const useScreenFocusStore = () => useContext(ScreenFocusStoreContext)

export { ScreenFocusProvider, useIsScreenFocused, useIsScreenFocusedRef, useScreenFocusStore }
