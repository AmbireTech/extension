import React, { useCallback, useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { KeyboardController } from 'react-native-keyboard-controller'
import { enableFreeze, ScreenStack, ScreenStackItem } from 'react-native-screens'

import { useOpenBottomSheetsCount } from '@common/components/BottomSheet/bottomSheetEventStream'
import { ScreenFocusProvider } from '@common/contexts/screenFocusContext'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import { ROUTES } from '@common/modules/router/constants/common'
import { useCanGoBackInWebViewHistory } from '@common/services/webview/webViewBackNavigation'
import flexbox from '@common/styles/utils/flexbox'
import AppRoutes from '@mobile/modules/router/components/AppRoutes'

import useStackEntries from './useStackEntries'

// Screens that are not on top are only frozen once this is switched on. Without
// it a screen the user cannot see keeps re-rendering on every controller update.
enableFreeze(true)

/**
 * Renders the router's history as a native stack: one platform screen per history
 * entry, so pushes, pops and the interactive back swipe are performed by
 * UINavigationController on iOS and by fragment transactions on Android. The
 * router stays the source of truth - the stack is derived from its history, and
 * the one case where the platform acts first (a swipe or the native back button)
 * is reconciled in `onDismissed`.
 */
const NavigationStack = () => {
  const entries = useStackEntries()
  const { theme } = useTheme()
  const { navigate } = useNavigation()
  const isSheetOpen = useOpenBottomSheetsCount() > 0
  const canGoBackInWebViewHistory = useCanGoBackInWebViewHistory()

  const topEntry = entries[entries.length - 1]
  const topCardKey = topEntry?.cardKey

  // While the in-app browser has page history, the swipe belongs to the page: the
  // browser screen runs its own edge gesture for that, and this one has to stay
  // out of its way. Once the page history runs out, the platform gesture takes
  // over again and popping the route is the right thing to do.
  const isBrowserWalkingItsOwnHistory =
    topEntry?.location.pathname === `/${ROUTES.dappWebView}` && canGoBackInWebViewHistory

  // The screen left behind stays mounted, so its focused input would otherwise
  // hold the keyboard up over the screen coming in.
  useEffect(() => {
    void KeyboardController.dismiss()
  }, [topCardKey])

  const handleDismissed = useCallback(
    (dismissCount: number) => {
      // The platform has already taken the screen off; the router only has to
      // catch up. The entries this drops are the ones that are already gone, so
      // nothing is animated a second time.
      navigate(-Math.max(dismissCount, 1))
    },
    [navigate]
  )

  return (
    <ScreenStack style={flexbox.flex1}>
      {entries.map((entry, index) => (
        <ScreenStackItem
          key={entry.cardKey}
          screenId={entry.cardKey}
          style={StyleSheet.absoluteFill}
          contentStyle={{ backgroundColor: theme.primaryBackground }}
          // The app draws its own headers inside the screens.
          headerConfig={{ hidden: true }}
          stackPresentation="push"
          stackAnimation="default"
          gestureEnabled={index > 0 && !isSheetOpen && !isBrowserWalkingItsOwnHistory}
          hideKeyboardOnSwipe
          freezeOnBlur
          onDismissed={(e) => handleDismissed(e.nativeEvent.dismissCount)}
        >
          <ScreenFocusProvider isFocused={entry.cardKey === topCardKey}>
            <AppRoutes location={entry.location} />
          </ScreenFocusProvider>
        </ScreenStackItem>
      ))}
    </ScreenStack>
  )
}

export default NavigationStack
