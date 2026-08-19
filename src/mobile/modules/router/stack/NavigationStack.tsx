import React, { useCallback, useEffect, useState } from 'react'
import { KeyboardController } from 'react-native-keyboard-controller'
import { enableFreeze, ScreenStack } from 'react-native-screens'

import { useOpenBottomSheetsCount } from '@common/components/BottomSheet/bottomSheetEventStream'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import { useCanGoBackInWebViewHistory } from '@common/services/webview/webViewBackNavigation'
import flexbox from '@common/styles/utils/flexbox'

import StackScreen from './StackScreen'
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

  const stackSignature = entries.map((e) => `${e.location.pathname}#${e.cardKey}`).join(' | ')

  /**
   * Which arrangement of screens the platform has finished transitioning to. A
   * screen is only frozen - it renders nothing while it is - once the stack has
   * come to rest in a state where that screen is not the one on top, so a screen
   * that is still sliding, or still visible underneath one that is, keeps
   * rendering. Driven by the stack's own event rather than by focus, which flips
   * at the start of a transition, while both screens are still on screen.
   */
  const [settledSignature, setSettledSignature] = useState('')
  const hasSettled = settledSignature === stackSignature

  const handleFinishTransitioning = useCallback(
    () => setSettledSignature(stackSignature),
    [stackSignature]
  )

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
          shouldFreeze={entry.cardKey !== topCardKey && hasSettled}
          gestureEnabled={index > 0 && !isSheetOpen && !isBrowserWalkingItsOwnHistory}
          onDismissed={handleDismissed}
        />
      ))}
    </ScreenStack>
  )
}

export default NavigationStack
