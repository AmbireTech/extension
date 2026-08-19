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
  /**
   * Whether this screen may stop rendering. A frozen screen renders nothing, so
   * this must only be true once the stack has settled with another screen on top
   * of it - see `NavigationStack`.
   */
  shouldFreeze: boolean
  gestureEnabled: boolean
  onDismissed: (dismissCount: number) => void
}

const StackScreen = ({ entry, isFocused, shouldFreeze, gestureEnabled, onDismissed }: Props) => {
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
      gestureEnabled={gestureEnabled}
      hideKeyboardOnSwipe
      freezeOnBlur
      shouldFreeze={shouldFreeze}
      onDismissed={handleDismissed}
    >
      <ScreenFocusProvider isFocused={isFocused}>
        <AppRoutes location={entry.location} />
      </ScreenFocusProvider>
    </ScreenStackItem>
  )
}

export default StackScreen
