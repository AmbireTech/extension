import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import { ScreenStackItem } from 'react-native-screens'

import { ScreenBackContext } from '@common/contexts/screenBackContext'
import { ScreenFocusProvider, ScreenTouchArea } from '@common/contexts/screenFocusContext'
import { ScreenLocationProvider } from '@common/contexts/screenLocationContext'
import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'
import useEdgeSwipeBackGesture from '@mobile/hooks/useEdgeSwipeBackGesture'
import AppRoutes from '@mobile/modules/router/components/AppRoutes'

import { StackEntry } from './stackEntries'

type Props = {
  entry: StackEntry
  /** The screen the user is on - the top of the stack. */
  isFocused: boolean
  /** Whether the platform has finished transitioning to this screen. */
  isSettled: boolean
  /** Whether there is a screen underneath this one to pop to. */
  canGoBack: boolean
  gestureEnabled: boolean
  onDismissed: (dismissCount: number) => void
}

/**
 * Whether the card's screens are rendered yet. Putting the platform screen up and
 * building the tree of the screen coming in is otherwise one commit, so the animation
 * cannot start until that tree is done. Split in two, the screen goes up a frame first.
 */
const useIsContentReady = () => {
  const [isContentReady, setIsContentReady] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsContentReady(true))

    return () => cancelAnimationFrame(frame)
  }, [])

  return isContentReady
}

const StackScreen = ({
  entry,
  isFocused,
  isSettled,
  canGoBack,
  gestureEnabled,
  onDismissed
}: Props) => {
  const { theme } = useTheme()
  const isContentReady = useIsContentReady()

  // A screen going back through steps of its own takes the swipe over from the stack,
  // whose native one can only pop the screen (see `useScreenBackHandler`)
  const [backHandler, setBackHandlerState] = useState<(() => void) | null>(null)
  const setBackHandler = useCallback(
    (handler: (() => void) | null) => setBackHandlerState(() => handler),
    []
  )
  const screenBack = useMemo(() => ({ setBackHandler }), [setBackHandler])
  const handleEdgeSwipeBack = useCallback(() => backHandler?.(), [backHandler])
  const edgeSwipeBackGesture = useEdgeSwipeBackGesture({
    enabled: !!backHandler,
    onBack: handleEdgeSwipeBack
  })

  const handleDismissed = useCallback(
    (e: { nativeEvent: { dismissCount: number } }) => onDismissed(e.nativeEvent.dismissCount),
    [onDismissed]
  )

  const contentStyle = useMemo(
    () => ({ backgroundColor: theme.primaryBackground }),
    [theme.primaryBackground]
  )

  return (
    <ScreenStackItem
      screenId={entry.cardKey}
      style={StyleSheet.absoluteFill}
      contentStyle={contentStyle}
      // The app draws its own headers inside the screens.
      headerConfig={{ hidden: true }}
      stackPresentation="push"
      stackAnimation="default"
      // Which direction a screen that takes the place of another one is animated
      // in. The platform defaults it to `pop`, so without this every automatic
      // navigation - the boot redirects, unlocking - would look like going back.
      replaceAnimation={entry.replaceAnimation}
      gestureEnabled={gestureEnabled && !backHandler}
      hideKeyboardOnSwipe
      onDismissed={handleDismissed}
    >
      {/* Above the content gate, so the screen's focus and its route are its own from */}
      {/* the frame it goes up - what handlers on the screen being left read. */}
      <ScreenFocusProvider isFocused={isFocused} isSettled={isSettled}>
        <ScreenLocationProvider location={entry.location} canGoBack={canGoBack}>
          <ScreenBackContext.Provider value={screenBack}>
            {/* Always mounted, and only enabled while a handler is set, so setting one */}
            {/* does not remount the screen */}
            <GestureDetector gesture={edgeSwipeBackGesture}>
              <View style={flexbox.flex1}>
                <ScreenTouchArea>
                  {!!isContentReady && <AppRoutes location={entry.location} />}
                </ScreenTouchArea>
              </View>
            </GestureDetector>
          </ScreenBackContext.Provider>
        </ScreenLocationProvider>
      </ScreenFocusProvider>
    </ScreenStackItem>
  )
}

export default React.memo(StackScreen)
