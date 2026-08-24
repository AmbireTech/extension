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

// A screen the user is not on keeps its views and its state, and is kept from
// working for nothing by not being subscribed to the controllers rather than by
// being frozen - `react-freeze` hides the screen with `display: none`, which drops
// every view it had, and putting them back costs more than all the re-renders it
// saved. See `useControllerState`.

/** Longer than any transition, for the navigations the platform does not animate. */
const SETTLE_FALLBACK_MS = 800

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

  /**
   * The card the platform has finished transitioning to. Work a screen puts off
   * until it is the one the user is on - reading the controller state it stopped
   * subscribing to while it was away, above all - waits for this, so a screen
   * coming back does not hold up the transition that brings it back with a render
   * of everything it missed.
   */
  const [settledCardKey, setSettledCardKey] = useState('')

  const handleFinishTransitioning = useCallback(
    () => setSettledCardKey(topCardKey ?? ''),
    [topCardKey]
  )

  // The platform does not report a transition it never ran (a card put up without
  // animating, a navigation the stack collapsed), and a screen waiting to catch up
  // would then wait forever.
  useEffect(() => {
    const timer = setTimeout(() => setSettledCardKey(topCardKey ?? ''), SETTLE_FALLBACK_MS)

    return () => clearTimeout(timer)
  }, [topCardKey])

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
