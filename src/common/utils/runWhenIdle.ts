/**
 * Runs `callback` once the JS thread is idle, replacing `InteractionManager.runAfterInteractions`
 * (removed in React Native 0.87). Safari has no `requestIdleCallback`, so it falls back to a
 * macrotask there. Returns a function that cancels the pending call.
 */
const runWhenIdle = (callback: () => void): (() => void) => {
  if (typeof requestIdleCallback === 'function') {
    const handle = requestIdleCallback(callback)

    return () => cancelIdleCallback(handle)
  }

  const timeoutId = setTimeout(callback, 0)

  return () => clearTimeout(timeoutId)
}

export default runWhenIdle
