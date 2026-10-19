import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useState
} from 'react'
import { GestureResponderEvent, View } from 'react-native'

import flexbox from '@common/styles/utils/flexbox'

import {
  createScreenFocusStore,
  runWhenScreenIsOnTop,
  ScreenFocusStore,
  WritableScreenFocusStore
} from './screenFocusStore'

// True by default: the extension and the websites render one route at a time, so
// whatever is mounted there is the focused screen.
const ScreenFocusContext = createContext(true)

// True by default for the same reason: with no stack to animate, a screen is there
// as soon as it renders.
const ScreenSettledContext = createContext(true)

const ALWAYS_FOCUSED_STORE = createScreenFocusStore(true)

const ScreenFocusStoreContext = createContext<WritableScreenFocusStore>(ALWAYS_FOCUSED_STORE)

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

  // An action held for this screen has nowhere to run once it is gone
  useEffect(() => () => store.cancelDeferred(), [store])

  // Focus gained is announced once the transition ends, because catching up re-renders
  // the whole screen. Focus lost is announced at once, since it only stops work.
  const shouldNotify = !isFocused || isSettled

  useEffect(() => {
    if (!shouldNotify) return

    store.notify()
  }, [isFocused, shouldNotify, store])

  return (
    <ScreenFocusStoreContext.Provider value={store}>
      <ScreenFocusContext.Provider value={isFocused}>
        <ScreenSettledContext.Provider value={isFocused && isSettled}>
          {children}
        </ScreenSettledContext.Provider>
      </ScreenFocusContext.Provider>
    </ScreenFocusStoreContext.Provider>
  )
}

/** Re-renders the component when its screen gains or loses focus. */
const useIsScreenFocused = () => useContext(ScreenFocusContext)

/**
 * Re-renders the component once the screen it is on is the one the user is on and the
 * platform has finished transitioning to it - what work that would compete with the
 * animation waits for.
 */
const useIsScreenSettled = () => useContext(ScreenSettledContext)

/** Focus as a store, for code that reacts to a change on its own. */
const useScreenFocusStore = (): ScreenFocusStore => useContext(ScreenFocusStoreContext)

/**
 * Tracks whether a finger is on the screen, for `runWhenScreenIsOnTop`. `onPress` runs
 * while the releasing touch is still counted: the responder events are dispatched
 * before the bubbled `onTouchEnd` that clears it.
 */
const ScreenTouchArea = ({ children }: { children: React.ReactNode }) => {
  const store = useContext(ScreenFocusStoreContext)

  const handleTouchStart = useCallback(() => store.setIsTouched(true), [store])
  const handleTouchEnd = useCallback(
    (e: GestureResponderEvent) => store.setIsTouched(e.nativeEvent.touches.length > 0),
    [store]
  )
  const handleTouchCancel = useCallback(() => store.setIsTouched(false), [store])

  return (
    <View
      style={flexbox.flex1}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {children}
    </View>
  )
}

export type { ScreenFocusStore }

export {
  runWhenScreenIsOnTop,
  ScreenFocusProvider,
  ScreenTouchArea,
  useIsScreenFocused,
  useIsScreenSettled,
  useScreenFocusStore
}
