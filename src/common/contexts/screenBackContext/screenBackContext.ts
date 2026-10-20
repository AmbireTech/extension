import { createContext, useContext, useEffect } from 'react'
import { BackHandler } from 'react-native'

import { useIsScreenFocused } from '@common/contexts/screenFocusContext'

/**
 * Lets a screen of the mobile stack take over going back from it (see
 * `useScreenBackHandler`). A no-op where there is no stack.
 */
const ScreenBackContext = createContext<{
  setBackHandler: (handler: (() => void) | null) => void
}>({ setBackHandler: () => {} })

/**
 * While given a handler, every way back from the screen - its back arrow (which the
 * screen points at the same handler), the swipe and Android's back - calls it instead of
 * leaving the screen, for a screen with steps of its own to go back through (e.g. a
 * carousel). Pass none once there is nothing left inside the screen, and going back
 * leaves it as usual.
 */
const useScreenBackHandler = (handler: (() => void) | null) => {
  const { setBackHandler } = useContext(ScreenBackContext)
  const isFocused = useIsScreenFocused()

  useEffect(() => {
    setBackHandler(handler)

    return () => setBackHandler(null)
  }, [handler, setBackHandler])

  // Android's back button (and back gesture) is app-wide, so only the screen on top takes it
  useEffect(() => {
    if (!handler || !isFocused) return

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      handler()
      return true
    })

    return () => subscription.remove()
  }, [handler, isFocused])
}

export { ScreenBackContext, useScreenBackHandler }
