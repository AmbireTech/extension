import React, { ReactNode, useCallback, useEffect, useState } from 'react'
import { LayoutChangeEvent, StyleSheet, View, ViewStyle } from 'react-native'
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'
import { BORDER_RADIUS_SECONDARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import PrivacyPoolsCornerFrames from '@web/modules/privacy-pools/components/PrivacyPoolsCornerFrames'

/** The width of the illustration in the design, which the ray's geometry is measured in */
const DESIGN_WIDTH = 352
const HEIGHT = 220

/** Wider than the illustration, so the ray never shows its edge wherever a step moves it */
const RAY_WIDTH = 450
const RAY_OPACITY = 0.16
/**
 * Across the streaks of the ray (33° down from the horizontal), from the ray's top-left corner
 * to where its bottom-right one falls on that line
 */
const RAY_GRADIENT_END = { x: 417, y: 270.8 }
/**
 * The design's light ray image, read across its streaks, with the colors its hatching shader
 * gives them: mix(#454A50, #F2F4F7, luminance × 1.36). A gradient instead of the image, so no
 * image or shader is shipped for it.
 */
const RAY_STOPS = [
  { offset: 0, color: '#D1D4D7' },
  { offset: 0.039, color: '#C5C8CC' },
  { offset: 0.075, color: '#86898E' },
  { offset: 0.096, color: '#6B6F75' },
  { offset: 0.146, color: '#5D6167' },
  { offset: 0.354, color: '#5D6168' },
  { offset: 0.389, color: '#6A6E73' },
  { offset: 0.439, color: '#5E6268' },
  { offset: 0.446, color: '#70747A' },
  { offset: 0.454, color: '#ADB0B4' },
  { offset: 0.461, color: '#CCCED2' },
  { offset: 0.482, color: '#EAECF0' },
  { offset: 0.511, color: '#D6D8DC' },
  { offset: 0.561, color: '#81858A' },
  { offset: 0.596, color: '#6B6F75' },
  { offset: 0.618, color: '#787C82' },
  { offset: 0.675, color: '#C7C9CD' },
  { offset: 0.718, color: '#DEE0E4' },
  { offset: 0.796, color: '#E1E4E7' },
  { offset: 0.882, color: '#C9CCD0' },
  { offset: 1, color: '#C9CCD0' }
]
const RAY_SLIDE_TIMING = { duration: 400 }

// Fixed, not theme colors: the frames glow white in both themes
const CORNER_COLOR = '#FFFFFF'
const CORNER_GLOW_BLUR = 4
const CORNER_INSET = 6
/** As in the design: the frames curve a bit wider than the illustration's own corners */
const CORNER_RADIUS = 14

// Moving it only recomposites the ray rather than repainting it every frame
const MOVING_LAYER = { willChange: 'transform' } as ViewStyle

// A `url(#id)` reference resolves to the first matching id in the document
let gradientIdCounter = 0

interface Props {
  /**
   * Where the ray's left edge is, in the design's pixels: zero or less, to the left of the
   * illustration. Each step moves it, so the light falls differently on every step.
   */
  rayOffset: number
  /** Centered on the illustration */
  children: ReactNode
}

/**
 * The illustration card of a step of the Privacy Pools guide: a light ray over the theme's
 * background, with glowing frames in its corners. Every step renders it in the same place, so the
 * same instance stays mounted and the ray slides to the new step's offset.
 */
const PrivacyPoolsGuideIllustration = ({ rayOffset, children }: Props) => {
  const { theme } = useTheme()
  const [gradientId] = useState(() => {
    gradientIdCounter += 1
    return `privacy-pools-guide-ray-${gradientIdCounter}`
  })
  // The ray is laid out in the design's pixels, stretched to the illustration's actual width
  const [width, setWidth] = useState(0)
  const scale = width / DESIGN_WIDTH
  const rayX = useSharedValue(rayOffset)

  const handleLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setWidth(layout.width)
  }, [])

  useEffect(() => {
    rayX.set(withTiming(rayOffset, RAY_SLIDE_TIMING))
  }, [rayOffset, rayX])

  const rayStyle = useAnimatedStyle(
    () => ({ transform: [{ translateX: rayX.get() * scale }] }),
    [scale]
  )

  return (
    <View
      onLayout={handleLayout}
      style={{
        width: '100%',
        height: HEIGHT,
        borderRadius: BORDER_RADIUS_SECONDARY,
        overflow: 'hidden',
        backgroundColor: theme.secondaryBackground
      }}
    >
      {!!width && (
        <Reanimated.View
          style={[
            MOVING_LAYER,
            { position: 'absolute', top: 0, left: 0, height: HEIGHT, width: RAY_WIDTH * scale },
            rayStyle
          ]}
        >
          <Svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${RAY_WIDTH} ${HEIGHT}`}
            preserveAspectRatio="none"
          >
            <Defs>
              <LinearGradient
                id={gradientId}
                gradientUnits="userSpaceOnUse"
                x1={0}
                y1={0}
                x2={RAY_GRADIENT_END.x}
                y2={RAY_GRADIENT_END.y}
              >
                {RAY_STOPS.map(({ offset, color }) => (
                  <Stop key={offset} offset={offset} stopColor={color} />
                ))}
              </LinearGradient>
            </Defs>
            <Rect
              width={RAY_WIDTH}
              height={HEIGHT}
              fill={`url(#${gradientId})`}
              opacity={RAY_OPACITY}
            />
          </Svg>
        </Reanimated.View>
      )}
      <View style={[StyleSheet.absoluteFill, flexbox.center]}>{children}</View>
      {/* Over the content, as in the design */}
      <PrivacyPoolsCornerFrames
        color={CORNER_COLOR}
        glowBlur={CORNER_GLOW_BLUR}
        insetX={CORNER_INSET}
        insetTop={CORNER_INSET}
        insetBottom={CORNER_INSET}
        cornerRadius={CORNER_RADIUS}
      />
    </View>
  )
}

export default React.memo(PrivacyPoolsGuideIllustration)
