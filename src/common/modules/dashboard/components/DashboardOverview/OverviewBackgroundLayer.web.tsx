import React from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import Reanimated, {
  DerivedValue,
  Extrapolation,
  interpolate,
  useAnimatedStyle
} from 'react-native-reanimated'

import { OverviewBackgroundLayerProps } from './OverviewBackgroundLayer'

// Moving it only recomposites the filtered image rather than repainting it every frame
const MOVING_LAYER = { willChange: 'transform' } as ViewStyle

const OverviewBackgroundLayer = ({
  geometry,
  collapse,
  children
}: OverviewBackgroundLayerProps) => {
  // The Reanimated value the pager is moved by on web
  const value = collapse as DerivedValue<number> | undefined

  const animatedStyle = useAnimatedStyle(() => {
    if (!geometry || !value) return {}

    const collapsed = value.get()

    return {
      transform: [
        { translateY: -collapsed / 2 },
        {
          scale:
            geometry.heightBoundCollapse > 0
              ? interpolate(
                  collapsed,
                  [0, geometry.heightBoundCollapse],
                  [1, geometry.minScale],
                  Extrapolation.CLAMP
                )
              : 1
        }
      ]
    }
  }, [geometry, value])

  if (!geometry || !value) return <View style={StyleSheet.absoluteFill}>{children}</View>

  const { width, height, left, top } = geometry

  return (
    <Reanimated.View
      style={[MOVING_LAYER, { position: 'absolute', width, height, left, top }, animatedStyle]}
    >
      {children}
    </Reanimated.View>
  )
}

export default React.memo(OverviewBackgroundLayer)
