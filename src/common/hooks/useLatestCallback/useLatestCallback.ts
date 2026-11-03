import { useCallback, useLayoutEffect, useRef } from 'react'

/**
 * Returns a function whose identity never changes but that always runs the latest `callback`.
 * For handlers passed to memoized children; not for calling during render.
 */
const useLatestCallback = <Args extends unknown[], Result>(callback: (...args: Args) => Result) => {
  const callbackRef = useRef(callback)

  useLayoutEffect(() => {
    callbackRef.current = callback
  })

  return useCallback((...args: Args) => callbackRef.current(...args), [])
}

export default useLatestCallback
