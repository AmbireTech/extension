import React, { useCallback, useRef } from 'react'
import { LayoutChangeEvent, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'

import { SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { OverviewCollapsibleProps } from './OverviewCollapsible'

// The card pads its bottom by SPACING_TY to match its top once collapsed, the rest of the
// SPACING_SM it has when open collapses together with the content
const CONTENT_PADDING = { paddingTop: SPACING_SM, paddingBottom: SPACING_SM - SPACING_TY }

/**
 * Collapses from the content's own height rather than a fixed one, which the content
 * outgrows on Android. Only clipped while collapsing, so nothing drawn past it is cut off.
 */
const OverviewCollapsible = ({ expansion, onLayoutChange, children }: OverviewCollapsibleProps) => {
  const expandedHeight = useSharedValue(0)
  const layout = useRef({ height: 0, expandedHeight: 0 })

  const reportLayout = useCallback(
    (next: Partial<typeof layout.current>) => {
      layout.current = { ...layout.current, ...next }
      onLayoutChange?.(layout.current)
    },
    [onLayoutChange]
  )

  const onLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => reportLayout({ height: nativeEvent.layout.height }),
    [reportLayout]
  )

  const onContentLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => {
      expandedHeight.set(nativeEvent.layout.height)
      reportLayout({ expandedHeight: nativeEvent.layout.height })
    },
    [expandedHeight, reportLayout]
  )

  const style = useAnimatedStyle(() => {
    const progress = expansion ? expansion.value : 1

    // Left unconstrained until measured, so it doesn't open with a collapse
    if (!expandedHeight.value) return {}

    return {
      height: progress * expandedHeight.value,
      overflow: progress < 1 ? 'hidden' : 'visible'
    }
  })

  return (
    <Animated.View style={style} onLayout={onLayout}>
      <View style={[flexbox.alignCenter, CONTENT_PADDING]} onLayout={onContentLayout}>
        {children}
      </View>
    </Animated.View>
  )
}

export default React.memo(OverviewCollapsible)
