import React, { useCallback, useEffect, useState } from 'react'
import { KeyboardController } from 'react-native-keyboard-controller'
import { ScreenStack } from 'react-native-screens'

import { useOpenBottomSheetsCount } from '@common/components/BottomSheet/bottomSheetEventStream'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import { useCanGoBackInWebViewHistory } from '@common/services/webview/webViewBackNavigation'
import flexbox from '@common/styles/utils/flexbox'

import StackScreen from './StackScreen'
import useStackEntries from './useStackEntries'

// Screens the user is not on keep their views and their state, and are kept from
// working for nothing by unsubscribing from the controllers (see `useControllerState`)
// rather than by `enableFreeze`, which hides them with `display: none` - dropping
// every view, and costing more to put back than the re-renders it saves.
//
// Freezing also needs this Reanimated patch, removed along with it, because React
// remounts the class components in a tree it hides:
// https://github.com/AmbireTech/ambire-mobile-wallet/blob/465eed493572512ccb22e30264753f313508ad8a/patches/react-native-reanimated+4.1.1.patch

/** Longer than any transition, for the navigations the platform does not animate. */
const SETTLE_FALLBACK_MS = 800

/**
 * Renders the router's history as a native stack: one platform screen per history
 * entry, so pushes, pops and the back swipe are run by UINavigationController on iOS
 * and by fragment transactions on Android. The router stays the source of truth - the
 * stack is derived from its history, and the one case where the platform acts first
 * (a swipe, the native back button) is reconciled in `onDismissed`.
 */
const NavigationStack = () => {
  const entries = useStackEntries()
  const { navigate } = useNavigation()
  const isSheetOpen = useOpenBottomSheetsCount() > 0
  const canGoBackInWebViewHistory = useCanGoBackInWebViewHistory()

  const topEntry = entries[entries.length - 1]
  const topCardKey = topEntry?.cardKey

  // While the in-app browser has page history the swipe belongs to the page, which
  // runs its own edge gesture; once that history runs out, popping the route is right.
  const isBrowserWalkingItsOwnHistory =
    topEntry?.location.pathname === `/${ROUTES.dappWebView}` && canGoBackInWebViewHistory

  /**
   * The card the platform has finished transitioning to. Work a screen defers until it
   * is the one the user is on - catching up on controller state above all - waits for
   * this, so a screen coming back does not hold up the transition that brings it.
   */
  const [settledCardKey, setSettledCardKey] = useState('')

  const handleFinishTransitioning = useCallback(
    () => setSettledCardKey(topCardKey ?? ''),
    [topCardKey]
  )

  // The platform reports no transition where it ran none - a card put up without
  // animating, a navigation the stack collapsed - and the wait would never end.
  useEffect(() => {
    const timer = setTimeout(() => setSettledCardKey(topCardKey ?? ''), SETTLE_FALLBACK_MS)

    return () => clearTimeout(timer)
  }, [topCardKey])

  // The screen left behind stays mounted, so its focused input would hold the keyboard
  // up over the screen coming in.
  useEffect(() => {
    void KeyboardController.dismiss()
  }, [topCardKey])

  const handleDismissed = useCallback(
    (dismissCount: number) => {
      // The platform has already taken the screen off and the router only catches up:
      // the entries this drops are gone, so nothing is animated a second time.
      navigate(-Math.max(dismissCount, 1))
    },
    [navigate]
  )

  return (
    <ScreenStack style={flexbox.flex1} onFinishTransitioning={handleFinishTransitioning}>
      {entries.map((entry, index) => (
        <StackScreen
          key={entry.cardKey}
          entry={entry}
          isFocused={entry.cardKey === topCardKey}
          isSettled={entry.cardKey === settledCardKey}
          gestureEnabled={index > 0 && !isSheetOpen && !isBrowserWalkingItsOwnHistory}
          onDismissed={handleDismissed}
        />
      ))}
    </ScreenStack>
  )
}

export default NavigationStack
