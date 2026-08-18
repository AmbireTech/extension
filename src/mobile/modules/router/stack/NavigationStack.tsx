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

const transitionId = ({ entry, isClosing }: Card) => `${entry.key}:${isClosing ? 'close' : 'open'}`

/** How far from the left edge a swipe has to start, as UIKit's edge gesture does. */
const GESTURE_RESPONSE_DISTANCE = 50
/** How much the fling velocity counts towards committing the swipe. */
const GESTURE_VELOCITY_IMPACT = 0.3
const GESTURE_ACTIVATION_OFFSET_X = 10
/** Beyond this much vertical movement the gesture gives way to scrolling. */
const GESTURE_FAIL_OFFSET_Y = 5

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
      ...closing.map((entry) => ({ entry, isClosing: true }))
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
        getOffset(entry.key, index === 0 || entry.key === settledKey)
      ),
    [cards, settledKey, getOffset]
  )

  useEffect(() => {
    let hasStartedATransition = false

    cards.forEach((card) => {
      const id = transitionId(card)
      if (startedTransitions.current.has(id)) return
      startedTransitions.current.add(id)

      const offset = offsets.get(card.entry.key)
      if (!offset) return

      if (card.isClosing) {
        const { key } = card.entry

        hasStartedATransition = true
        driveOffset(
          offset,
          animateOffset(width, CLOSE_SPEC, undefined, (finished) => {
            'worklet'

            if (finished) runOnJS(removeClosingEntry)(key)
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

    const liveKeys = new Set(cards.map(({ entry }) => entry.key))
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

  const topKey = entries[entries.length - 1]?.key
  const topEntry = entries[entries.length - 1]
  const topOffset = cardOffsets[cardOffsets.length - 1]

  const isSheetOpen = useOpenBottomSheetsCount() > 0
  // The in-app browser walks its own page history before the route is popped, so
  // the card must not follow the finger there - there may be nothing to reveal.
  const isBrowserRoute = topEntry?.location.pathname === `/${ROUTES.dappWebView}`
  const canPop = entries.length > 1 && !closing.length
  const hasOwnBackBehaviour = isSheetOpen || isBrowserRoute
  const canDragCard = canPop && !hasOwnBackBehaviour

  const triggerBack = useBackAction()
  const { goBack } = useNavigation()

  // Android has no edge swipe convention - the system back gesture reaches the
  // app as a hardware back press instead, and is handled by `useBackAction`.
  const isGestureEnabled = isiOS && (canPop || hasOwnBackBehaviour)

  // Memoized so the detector is not handed a freshly built gesture on every
  // render; the deps only change on navigation or when a sheet opens.
  const swipeBackGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(isGestureEnabled)
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
    [isGestureEnabled, canDragCard, topOffset, width, triggerBack, goBack]
  )

  return (
    <GestureDetector gesture={swipeBackGesture}>
      <View style={flexbox.flex1}>
        {cards.map(({ entry, isClosing }, index) => (
          <ScreenCard
            key={entry.key}
            offset={cardOffsets[index]!}
            nextOffset={cardOffsets[index + 1] || null}
            isInteractive={entry.key === topKey && !closing.length}
            isFocused={!isClosing && entry.key === topKey}
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
