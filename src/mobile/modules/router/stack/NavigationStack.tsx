import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWindowDimensions, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { KeyboardController } from 'react-native-keyboard-controller'
import { cancelAnimation, clamp, makeMutable, runOnJS, SharedValue } from 'react-native-reanimated'

import { useOpenBottomSheetsCount } from '@common/components/BottomSheet/bottomSheetEventStream'
import { isiOS } from '@common/config/env'
import useBackAction from '@common/hooks/useBackAction'
import useNavigation from '@common/hooks/useNavigation'
import { ROUTES } from '@common/modules/router/constants/common'
import flexbox from '@common/styles/utils/flexbox'
import AppRoutes from '@mobile/modules/router/components/AppRoutes'

import { animateOffset, CLOSE_SPEC, driveOffset, OPEN_SPEC } from './presets'
import ScreenCard from './ScreenCard'
import { StackEntry } from './stackEntries'
import useStackEntries from './useStackEntries'

type Card = { entry: StackEntry; isClosing: boolean }

const transitionId = ({ entry, isClosing }: Card) =>
  `${entry.cardKey}:${isClosing ? 'close' : 'open'}`

/** How far from the left edge a swipe has to start, as UIKit's edge gesture does. */
const GESTURE_RESPONSE_DISTANCE = 50
/** How much the fling velocity counts towards committing the swipe. */
const GESTURE_VELOCITY_IMPACT = 0.3
/**
 * A swipe is claimed as soon as it travels this far sideways, and given up if it
 * drifts this far vertically first. The vertical tolerance is deliberately the
 * larger of the two: a thumb swipe arcs, so a tighter one would fail the gesture
 * before it ever got going, while a genuine vertical scroll still crosses it long
 * before the sideways threshold. Both are UIKit's own figures.
 */
const GESTURE_ACTIVATION_OFFSET_X = 5
const GESTURE_FAIL_OFFSET_Y = 20

/**
 * Renders the router's history as a stack of cards instead of a single screen,
 * so the screen being left behind stays mounted (and keeps rendering for its
 * own location) while the next one animates in.
 */
const NavigationStack = () => {
  const { entries, closing, settledKey, removeClosingEntry } = useStackEntries()
  const { width } = useWindowDimensions()

  // The stack owns the animated offsets, because a card animates from both its
  // own offset and the offset of the card stacked on top of it - and because the
  // swipe back gesture needs to drive the top card's offset directly.
  // Held in state rather than a ref, because the offsets are read while
  // rendering: a card must already be off screen on its first frame.
  const [offsets] = useState(() => new Map<string, SharedValue<number>>())
  const startedTransitions = useRef(new Set<string>())

  const cards: Card[] = useMemo(
    () => [
      ...entries.map((entry) => ({ entry, isClosing: false })),
      // Sorted, so that several cards leaving at once keep the order they had in
      // the stack rather than the order they were popped in.
      ...[...closing].sort((a, b) => a.index - b.index).map((entry) => ({ entry, isClosing: true }))
    ],
    [entries, closing]
  )

  const getOffset = useCallback(
    (key: string, isSettled: boolean) => {
      const existing = offsets.get(key)
      if (existing) return existing

      // Created during render, so a card pushed on top of another one is off
      // screen on its very first frame instead of flashing in place. A card
      // revealed by a pop is already where it belongs.
      const offset = makeMutable(isSettled ? 0 : width)
      offsets.set(key, offset)

      return offset
    },
    [offsets, width]
  )

  const cardOffsets = useMemo(
    () =>
      cards.map(({ entry }, index) =>
        getOffset(entry.cardKey, index === 0 || entry.cardKey === settledKey)
      ),
    [cards, settledKey, getOffset]
  )

  useEffect(() => {
    let hasStartedATransition = false

    cards.forEach((card) => {
      const id = transitionId(card)
      if (startedTransitions.current.has(id)) return
      startedTransitions.current.add(id)

      const offset = offsets.get(card.entry.cardKey)
      if (!offset) return

      if (card.isClosing) {
        const { cardKey } = card.entry

        hasStartedATransition = true
        driveOffset(
          offset,
          // Removed whatever the outcome: an interrupted close animation must not
          // leave the card mounted forever, and nothing else drives its offset.
          animateOffset(width, CLOSE_SPEC, undefined, () => {
            'worklet'

            runOnJS(removeClosingEntry)(cardKey)
          })
        )

        return
      }

      if (offset.value === 0) return

      hasStartedATransition = true
      driveOffset(offset, animateOffset(0, OPEN_SPEC))
    })

    // The screen being left behind stays mounted, so its focused input would
    // otherwise keep the keyboard up over the screen coming in.
    if (hasStartedATransition) void KeyboardController.dismiss()

    const liveKeys = new Set(cards.map(({ entry }) => entry.cardKey))
    const liveTransitions = new Set(cards.map(transitionId))

    offsets.forEach((offset, key) => {
      if (liveKeys.has(key)) return

      cancelAnimation(offset)
      offsets.delete(key)
    })
    startedTransitions.current.forEach((id) => {
      if (!liveTransitions.has(id)) startedTransitions.current.delete(id)
    })
  }, [cards, offsets, width, removeClosingEntry])

  const topCardKey = entries[entries.length - 1]?.cardKey
  const topEntry = entries[entries.length - 1]
  // The offset of the top *entry*, not of the last card: while a pop animates,
  // the last card is the one leaving, and the gesture must never drive that one.
  const topOffset = cardOffsets[entries.length - 1]

  const isSheetOpen = useOpenBottomSheetsCount() > 0
  // The in-app browser walks its own page history before the route is popped, so
  // the card must not follow the finger there - there may be nothing to reveal.
  const isBrowserRoute = topEntry?.location.pathname === `/${ROUTES.dappWebView}`
  // Deliberately not gated on a card still animating away: that card is inert and
  // is not the one the gesture drives, so there is no reason to refuse the drag
  // until it has gone.
  const canPop = entries.length > 1
  const hasOwnBackBehaviour = isSheetOpen || isBrowserRoute
  const canDragCard = canPop && !hasOwnBackBehaviour

  const triggerBack = useBackAction()
  const { goBack } = useNavigation()

  // Memoized so the detector is not handed a freshly built gesture on every
  // render; the deps only change on navigation or when a sheet opens.
  const swipeBackGesture = useMemo(
    () =>
      Gesture.Pan()
        // Enabled purely by platform, never by navigation state: toggling this
        // changes the native handler's configuration, and the back arrow sits
        // inside the edge strip - so a tap on it would reconfigure the handler
        // mid-touch. What the gesture may do is decided in the callbacks instead.
        // Android has no edge swipe convention; there the system back gesture
        // arrives as a hardware back press and `useBackAction` handles it.
        .enabled(isiOS)
        .activeOffsetX(GESTURE_ACTIVATION_OFFSET_X)
        .failOffsetY([-GESTURE_FAIL_OFFSET_Y, GESTURE_FAIL_OFFSET_Y])
        .hitSlop({ left: 0, width: GESTURE_RESPONSE_DISTANCE })
        .onUpdate((e) => {
          'worklet'

          if (!canDragCard || !topOffset) return

          driveOffset(topOffset, clamp(e.translationX, 0, width))
        })
        .onEnd((e) => {
          'worklet'

          // The same rule UIKit uses: past the half way point, or flicked hard
          // enough to get there.
          const shouldGoBack = e.translationX + e.velocityX * GESTURE_VELOCITY_IMPACT > width / 2

          if (!canDragCard || !topOffset) {
            if (shouldGoBack) runOnJS(triggerBack)()

            return
          }

          driveOffset(
            topOffset,
            animateOffset(shouldGoBack ? width : 0, CLOSE_SPEC, e.velocityX, (finished) => {
              'worklet'

              // The card is already off screen, so the pop it triggers only has
              // to catch up with the history - it plays no further animation.
              if (finished && shouldGoBack) runOnJS(goBack)()
            })
          )
        }),
    [canDragCard, topOffset, width, triggerBack, goBack]
  )

  return (
    <GestureDetector gesture={swipeBackGesture}>
      <View style={flexbox.flex1}>
        {cards.map(({ entry, isClosing }, index) => (
          <ScreenCard
            key={entry.cardKey}
            offset={cardOffsets[index]!}
            nextOffset={cardOffsets[index + 1] || null}
            isFocused={entry.cardKey === topCardKey && !isClosing}
            isClosing={isClosing}
          >
            <AppRoutes location={entry.location} />
          </ScreenCard>
        ))}
      </View>
    </GestureDetector>
  )
}

export default NavigationStack
