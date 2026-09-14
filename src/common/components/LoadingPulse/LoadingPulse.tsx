import React, { memo, useEffect, useRef } from 'react'
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'

const ANIMATION_DURATION = 700

interface Props {
  children: React.ReactNode
  // Opacity range the pulse animates between. Defaults keep the content readable
  // (never fully faded) while still clearly signalling "loading".
  minOpacity?: number
  maxOpacity?: number
  style?: StyleProp<ViewStyle>
}

// Wraps content in an opacity pulse to indicate it is stale/loading (e.g. a cached
// balance shown while the fresh portfolio loads). Mirrors SkeletonLoader's animation.
const LoadingPulse: React.FC<Props> = ({ children, minOpacity = 0.4, maxOpacity = 1, style }) => {
  const pulseAnim = useRef(new Animated.Value(maxOpacity)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: minOpacity,
          duration: ANIMATION_DURATION,
          easing: Easing.in(Easing.ease),
          useNativeDriver: !isWeb
        }),
        Animated.timing(pulseAnim, {
          toValue: maxOpacity,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.ease),
          useNativeDriver: !isWeb
        })
      ])
    )
    animation.start()

    return () => {
      pulseAnim.stopAnimation()
    }
  }, [minOpacity, maxOpacity, pulseAnim])

  return <Animated.View style={[style, { opacity: pulseAnim }]}>{children}</Animated.View>
}

export default memo(LoadingPulse)
