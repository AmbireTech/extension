import { isDev } from '@common/config/env'

type DeferredAction = {
  run: () => void
  onExpired: () => void
}

/**
 * Focus to read and to listen to, never to render from: the object's identity never
 * changes, so gaining or losing focus re-renders nothing. What a screen left behind
 * renders is paid in the commit that starts the transition to the next one.
 */
export type ScreenFocusStore = {
  /** Readable from handlers and effects without subscribing to it. */
  isFocused: { current: boolean }
  /**
   * Whether a finger is on the screen right now. A touch proves the user sees the
   * screen, even when the stack has not caught up with a swipe back yet.
   */
  isTouched: { current: boolean }
  /** Notified after `isFocused` has changed. */
  subscribe: (listener: () => void) => () => void
  /**
   * Holds an action until `isFocused` turns true, or expires it if that does not happen
   * within `timeoutMs`. Every action the current touch fires is held, in order; one
   * from a later touch while they wait is expired at once, as a second tap on a
   * screen on top would be refused.
   */
  deferUntilFocused: (action: DeferredAction, timeoutMs: number) => void
}

export type WritableScreenFocusStore = ScreenFocusStore & {
  setIsFocused: (next: boolean) => void
  setIsTouched: (next: boolean) => void
  /** Drops the held actions without running them - for a screen going away. */
  cancelDeferred: () => void
  notify: () => void
}

export const createScreenFocusStore = (isFocused: boolean): WritableScreenFocusStore => {
  const isFocusedRef = { current: isFocused }
  const isTouchedRef = { current: false }
  const listeners = new Set<() => void>()
  // Tells the actions of one tap apart from those of the next
  let touchId = 0
  let deferred: {
    touchId: number
    actions: DeferredAction[]
    timeout: ReturnType<typeof setTimeout>
  } | null = null

  const takeDeferred = () => {
    if (!deferred) return []

    const { actions, timeout } = deferred
    deferred = null
    clearTimeout(timeout)

    return actions
  }

  return {
    isFocused: isFocusedRef,
    isTouched: isTouchedRef,
    setIsFocused: (next: boolean) => {
      isFocusedRef.current = next
      if (!next) return

      takeDeferred().forEach((action) => action.run())
    },
    setIsTouched: (next: boolean) => {
      if (next) touchId++
      isTouchedRef.current = next
    },
    deferUntilFocused: (action, timeoutMs) => {
      if (deferred) {
        if (deferred.touchId === touchId) deferred.actions.push(action)
        else action.onExpired()

        return
      }

      const timeout = setTimeout(
        () => takeDeferred().forEach((expired) => expired.onExpired()),
        timeoutMs
      )
      deferred = { touchId, actions: [action], timeout }
    },
    cancelDeferred: () => {
      takeDeferred()
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

/** Longer than the router takes to catch up with a swipe back, however busy the JS thread. */
export const RUN_WHEN_ON_TOP_TIMEOUT_MS = 500

/**
 * Runs an action on the user's behalf - navigating, moving a flow on - only from the
 * screen on top, so an effect on a screen further back cannot send the user elsewhere.
 *
 * The focus flag is only as current as the last commit: after a swipe back on a busy JS
 * thread, the tap on the revealed screen is handled before the router has been told
 * the screen above is gone. Acting then would navigate from the stale route, so a touch
 * in progress (which proves the user sees the screen) defers the action until the stack
 * commits the screen as the top one instead.
 */
export const runWhenScreenIsOnTop = (store: ScreenFocusStore, action: string, run: () => void) => {
  if (store.isFocused.current) {
    run()
    return
  }

  const warnIgnored = () => {
    if (isDev) console.warn(`${action} ignored from a screen that is not on top`)
  }

  if (!store.isTouched.current) {
    warnIgnored()
    return
  }

  store.deferUntilFocused({ run, onExpired: warnIgnored }, RUN_WHEN_ON_TOP_TIMEOUT_MS)
}
