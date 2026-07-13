import React from 'react'
import { StyleProp, View, ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import useTheme from '@common/hooks/useTheme'
import { hexToRgba } from '@common/styles/utils/common'

// Monotonicity is enforced at the render layer: the displayed width is
// `max(current, target)`, so the bar never visually rewinds within a load.
const DappProgressBar = ({
  progress,
  style
}: {
  progress: number
  style?: StyleProp<ViewStyle>
}) => {
  const { theme } = useTheme()

  const width = useSharedValue(0)
  const targetProgress = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => {
    width.value = withTiming(Math.max(width.value, targetProgress.value), {
      duration: 300
    })

    return {
      width: `${width.value * 100}%`
    }
  })

  React.useEffect(() => {
    targetProgress.value = progress
    if (progress === 1) {
      width.value = withTiming(1, { duration: 200 })
    }
  }, [progress, targetProgress, width])

  return (
    <View
      style={[
        {
          height: 2,
          backgroundColor: hexToRgba(theme.info200, 0.3)
        },
        style
      ]}
    >
      <Animated.View
        style={[
          {
            height: 2,
            backgroundColor: theme.info200
          },
          animatedStyle
        ]}
      />
    </View>
  )
}

export default DappProgressBar
