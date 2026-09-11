import React, { useCallback } from 'react'
import { StyleSheet } from 'react-native'
import { ScreenStackItem } from 'react-native-screens'

import { ScreenFocusProvider } from '@common/contexts/screenFocusContext'
import useTheme from '@common/hooks/useTheme'
import AppRoutes from '@mobile/modules/router/components/AppRoutes'

import { StackEntry } from './stackEntries'

type Props = {
  entry: StackEntry
  /** The screen the user is on - the top of the stack. */
  isFocused: boolean
  /** Whether the platform has finished transitioning to this screen. */
  isSettled: boolean
  gestureEnabled: boolean
  onDismissed: (dismissCount: number) => void
}

const StackScreen = ({ entry, isFocused, isSettled, gestureEnabled, onDismissed }: Props) => {
  const { theme } = useTheme()

  const handleDismissed = useCallback(
    (e: { nativeEvent: { dismissCount: number } }) => onDismissed(e.nativeEvent.dismissCount),
    [onDismissed]
  )

  return (
    <ScreenStackItem
      screenId={entry.cardKey}
      style={StyleSheet.absoluteFill}
      contentStyle={{ backgroundColor: theme.primaryBackground }}
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
      <ScreenFocusProvider isFocused={isFocused} isSettled={isSettled}>
        <AppRoutes location={entry.location} />
      </ScreenFocusProvider>
    </ScreenStackItem>
  )
}

export default StackScreen
