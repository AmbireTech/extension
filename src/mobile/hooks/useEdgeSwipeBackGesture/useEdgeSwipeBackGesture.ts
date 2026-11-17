import { useMemo } from 'react'
import { useWindowDimensions } from 'react-native'
import { Gesture } from 'react-native-gesture-handler'
import { runOnJS } from 'react-native-reanimated'

import { isiOS } from '@common/config/env'

/**
 * UIKit's own figures for its screen edge back gesture, reused so a swipe standing in for
 * it feels like the platform one: it starts within this many points of the left edge, is
 * claimed after this much sideways travel, gives way to scrolling beyond this much
 * vertical drift, and commits past the half way point - or short of it when flicked hard
 * enough.
 */
const EDGE_SWIPE_RESPONSE_DISTANCE = 50
const EDGE_SWIPE_ACTIVATION_OFFSET_X = 5
const EDGE_SWIPE_FAIL_OFFSET_Y = 20
const EDGE_SWIPE_VELOCITY_IMPACT = 0.3

/**
 * An iOS left edge swipe that calls `onBack`, for a screen to go back through something of
 * its own (the browser's page history, a carousel's steps) while the native stack has its
 * edge swipe - which can only ever pop the screen - turned off. Nothing follows the finger.
 * Android needs none: its back gesture arrives as the back button.
 */
const useEdgeSwipeBackGesture = ({ enabled, onBack }: { enabled: boolean; onBack: () => void }) => {
  const { width: windowWidth } = useWindowDimensions()

  return useMemo(
    () =>
      Gesture.Pan()
        .enabled(isiOS && enabled)
        .activeOffsetX(EDGE_SWIPE_ACTIVATION_OFFSET_X)
        .failOffsetY([-EDGE_SWIPE_FAIL_OFFSET_Y, EDGE_SWIPE_FAIL_OFFSET_Y])
        .hitSlop({ left: 0, width: EDGE_SWIPE_RESPONSE_DISTANCE })
        .onEnd((e) => {
          'worklet'

          const shouldGoBack =
            e.translationX + e.velocityX * EDGE_SWIPE_VELOCITY_IMPACT > windowWidth / 2

          if (shouldGoBack) runOnJS(onBack)()
        }),
    [enabled, onBack, windowWidth]
  )
}

export default useEdgeSwipeBackGesture
