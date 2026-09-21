import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { StyleSheet } from 'react-native'
import { ScreenStackItem } from 'react-native-screens'

import { ScreenFocusProvider } from '@common/contexts/screenFocusContext'
import { ScreenLocationProvider } from '@common/contexts/screenLocationContext'
import useTheme from '@common/hooks/useTheme'
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
      gestureEnabled={gestureEnabled}
      hideKeyboardOnSwipe
      onDismissed={handleDismissed}
    >
      {/* Above the content gate, so the screen's focus and its route are its own from */}
      {/* the frame it goes up - what handlers on the screen being left read. */}
      <ScreenFocusProvider isFocused={isFocused} isSettled={isSettled}>
        <ScreenLocationProvider location={entry.location} canGoBack={canGoBack}>
          {!!isContentReady && <AppRoutes location={entry.location} />}
        </ScreenLocationProvider>
      </ScreenFocusProvider>
    </ScreenStackItem>
  )
}

export default React.memo(StackScreen)
