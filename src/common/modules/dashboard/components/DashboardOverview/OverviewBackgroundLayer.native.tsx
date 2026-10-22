import React, { useMemo } from 'react'
import { Animated, StyleSheet } from 'react-native'

import { OverviewBackgroundLayerProps } from './OverviewBackgroundLayer'

const OverviewBackgroundLayer = ({
  geometry,
  collapse,
  children
}: OverviewBackgroundLayerProps) => {
  const style = useMemo(() => {
    if (!geometry || !collapse) return StyleSheet.absoluteFillObject

    // The native animated value the pager is moved by on mobile
    const value = collapse as Animated.AnimatedInterpolation<number>
    const { width, height, left, top, heightBoundCollapse, minScale } = geometry

    return {
      position: 'absolute' as const,
      width,
      height,
      left,
      top,
      transform: [
        { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [0, -0.5] }) },
        {
          scale:
            heightBoundCollapse > 0
              ? value.interpolate({
                  inputRange: [0, heightBoundCollapse],
                  outputRange: [1, minScale],
                  extrapolate: 'clamp'
                })
              : 1
        }
      ]
    }
  }, [collapse, geometry])

  return <Animated.View style={style}>{children}</Animated.View>
}

export default React.memo(OverviewBackgroundLayer)
