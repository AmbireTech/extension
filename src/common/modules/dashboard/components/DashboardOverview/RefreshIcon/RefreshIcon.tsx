import React, { memo, useEffect, useRef } from 'react'
import { Animated, DimensionValue, Easing } from 'react-native'
import { SvgProps } from 'react-native-svg'

import RefreshSvg from '@common/assets/svg/RefreshIcon'

const RefreshIcon = ({
  color,
  spin,
  width,
  height
}: {
  color?: SvgProps['color']
  spin?: boolean
  width: SvgProps['width']
  height: SvgProps['height']
}) => {
  const spinValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null

    if (spin) {
      animation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true
        })
      )
      animation.start()
    } else {
      spinValue.stopAnimation()
      spinValue.setValue(0)
    }

    return () => {
      if (animation) {
        animation.stop()
      }
    }
  }, [spin, spinValue])

  const spinAnimation = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  })

  return (
    <Animated.View
      style={{
        width: width as DimensionValue,
        height: height as DimensionValue,
        transform: [{ rotate: spinAnimation }]
      }}
    >
      <RefreshSvg color={color} width={width} height={height} />
    </Animated.View>
  )
}

export default memo(RefreshIcon)
