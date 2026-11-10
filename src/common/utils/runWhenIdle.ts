// On mobile the controllers share the JS thread, so it may never go idle while they work, and
// React Native lets an idle callback wait up to 5 minutes without a timeout
const IDLE_TIMEOUT = 500

/**
 * Runs `callback` once the JS thread is idle, or after `IDLE_TIMEOUT` ms at the latest, replacing
 * `InteractionManager.runAfterInteractions` (removed in React Native 0.87). Unlike it, this does
 * not wait for running animations or gestures. Safari has no `requestIdleCallback`, so it falls
 * back to a macrotask there. Returns a function that cancels the pending call.
 */
const runWhenIdle = (callback: () => void): (() => void) => {
  if (typeof requestIdleCallback === 'function') {
    const handle = requestIdleCallback(callback, { timeout: IDLE_TIMEOUT })

    return () => cancelIdleCallback(handle)
  }

  const timeoutId = setTimeout(callback, 0)

  return () => clearTimeout(timeoutId)
}

export default runWhenIdle
