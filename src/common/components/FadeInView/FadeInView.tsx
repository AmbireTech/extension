import React, { useLayoutEffect } from 'react'
import { ViewProps } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

const FADE_IN_DURATION = 150

/**
 * A view that fades in when it mounts.
 *
 * Use it instead of an `entering` layout animation for views inside `AboveSheetsOverlay`.
 * On Android an `entering` animation there can leave the view out of the overlay's touch
 * handling, so taps on it go through to the views below. The fade starts from the view's own
 * mount, so it also plays in full inside a portal, which mounts its content a render later.
 */
const FadeInView = ({ style, ...rest }: ViewProps) => {
  const opacity = useSharedValue(0)

  useLayoutEffect(() => {
    opacity.value = withTiming(1, { duration: FADE_IN_DURATION })
  }, [opacity])

  const fadeInStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return <Animated.View style={[style, fadeInStyle]} {...rest} />
}

export default React.memo(FadeInView)
