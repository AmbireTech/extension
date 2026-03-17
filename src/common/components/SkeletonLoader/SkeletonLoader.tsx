import React, { memo, useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'

import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

import { SkeletonLoaderProps } from './types'

const ANIMATION_DURATION: number = 700

const sharedAnimationConfig = {
  duration: ANIMATION_DURATION,
  useNativeDriver: !isWeb
}
const SkeletonLoader = ({
  width,
  height,
  borderRadius = BORDER_RADIUS_PRIMARY,
  style,
  lowOpacity = false,
  appearance
}: SkeletonLoaderProps) => {
  const pulseAnim = useRef(new Animated.Value(0)).current
  const { theme } = useTheme()

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          ...sharedAnimationConfig,
          toValue: lowOpacity ? 0.7 : 1,
          easing: Easing.out(Easing.ease)
        }),
        Animated.timing(pulseAnim, {
          ...sharedAnimationConfig,
          toValue: 0.2,
          easing: Easing.in(Easing.ease)
        })
      ])
    ).start()

    return () => {
      // cleanup
      pulseAnim.stopAnimation()
    }
  }, [lowOpacity, pulseAnim])

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: theme[appearance || 'secondaryBackground'],
          borderRadius
        },
        { opacity: pulseAnim },
        //@ts-ignore
        style
      ]}
    />
  )
}

export default memo(SkeletonLoader)
