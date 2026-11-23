import React, { ReactNode, useState } from 'react'
import { StyleSheet, View, ViewStyle } from 'react-native'
import { Defs, G, LinearGradient, Rect, Stop, Svg } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'
import { BORDER_RADIUS_SECONDARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import PrivacyPoolsCornerFrames from '@web/modules/privacy-pools/components/PrivacyPoolsCornerFrames'

/** The width of the illustration in the design, which the ray's geometry is measured in */
const DESIGN_WIDTH = 352
const HEIGHT = 220

/** Wider than the illustration, so the ray never shows its edge while it slides */
const RAY_WIDTH = 450
const RAY_OPACITY = 0.16
/**
 * How far the ray slides to the left by the last step, in percent of its own width: almost
 * all of what it is wider than the illustration, so its edge never shows
 */
const RAY_TRAVEL = ((RAY_WIDTH - DESIGN_WIDTH) / RAY_WIDTH) * 0.95 * 100

/**
 * The design's light ray image has two rays, their streaks at slightly different angles, so each
 * is a gradient of its own, read across its streaks: from the ray's top-left corner to where its
 * bottom-right one falls on that line. Their colors are the ones the design's hatching shader
 * gives them: mix(#454A50, #F2F4F7, luminance × 1.36). Gradients instead of the image, so no
 * image or shader is shipped for it.
 */
const MAIN_RAY = {
  /** The narrow ray, 34° down from the horizontal, with the dark area left of it */
  end: { x: 411.3, y: 277.4 },
  stops: [
    { offset: 0, color: '#D0D3D7' },
    { offset: 0.0083, color: '#CCCFD3' },
    { offset: 0.015, color: '#C6C9CD' },
    { offset: 0.0217, color: '#BCBFC3' },
    { offset: 0.0483, color: '#878A90' },
    { offset: 0.0617, color: '#72767C' },
    { offset: 0.0717, color: '#696D73' },
    { offset: 0.0817, color: '#63676D' },
    { offset: 0.1017, color: '#5E6268' },
    { offset: 0.3317, color: '#5D6167' },
    { offset: 0.3517, color: '#5F6369' },
    { offset: 0.3717, color: '#686C72' },
    { offset: 0.3783, color: '#696C72' },
    { offset: 0.4017, color: '#5E6268' },
    { offset: 0.4317, color: '#5E6268' },
    { offset: 0.435, color: '#62666C' },
    { offset: 0.4383, color: '#6E7278' },
    { offset: 0.4417, color: '#878B90' },
    { offset: 0.445, color: '#A9ACB0' },
    { offset: 0.4483, color: '#C7CACE' },
    { offset: 0.4517, color: '#D1D3D7' },
    { offset: 0.455, color: '#D0D2D6' },
    { offset: 0.4583, color: '#CBCED1' },
    { offset: 0.4617, color: '#D1D4D7' },
    { offset: 0.4683, color: '#E6E9EC' },
    { offset: 0.4717, color: '#EBEDF0' },
    { offset: 0.4783, color: '#EFF1F4' },
    { offset: 0.485, color: '#EBEDF0' },
    { offset: 0.495, color: '#DBDDE1' },
    { offset: 0.505, color: '#D5D7DB' },
    { offset: 0.5117, color: '#CDCFD3' },
    { offset: 0.515, color: '#C7CACE' },
    { offset: 0.5317, color: '#A3A6AB' },
    { offset: 0.5483, color: '#878A90' },
    { offset: 0.565, color: '#74787E' },
    { offset: 0.5817, color: '#6B6E74' },
    { offset: 0.585, color: '#676B71' },
    { offset: 0.5883, color: '#60646A' },
    { offset: 0.5917, color: '#6B6F75' },
    { offset: 1, color: '#6B6F75' }
  ]
}
const SECOND_RAY = {
  /** The wide ray right of the main one, 42° down, drawn over it from the dark gap between them */
  end: { x: 357.9, y: 322.3 },
  stops: [
    { offset: 0, color: '#6B6F75', opacity: 0 },
    { offset: 0.535, color: '#6B6F75', opacity: 0 },
    { offset: 0.5383, color: '#A1A5A9', opacity: 0 },
    { offset: 0.5417, color: '#989BA0', opacity: 0.02 },
    { offset: 0.555, color: '#7F8388', opacity: 0.19 },
    { offset: 0.5583, color: '#7B7F84', opacity: 0.21 },
    { offset: 0.5617, color: '#777B80', opacity: 0.26 },
    { offset: 0.565, color: '#74787E', opacity: 0.29 },
    { offset: 0.5683, color: '#73777C', opacity: 0.34 },
    { offset: 0.575, color: '#6F7379', opacity: 0.41 },
    { offset: 0.5783, color: '#6F7378', opacity: 0.46 },
    { offset: 0.5817, color: '#6E7278', opacity: 0.48 },
    { offset: 0.585, color: '#6E7278', opacity: 0.54 },
    { offset: 0.5883, color: '#6E7278', opacity: 0.57 },
    { offset: 0.5917, color: '#6E7277', opacity: 0.61 },
    { offset: 0.5983, color: '#70747A', opacity: 0.68 },
    { offset: 0.6017, color: '#72767B', opacity: 0.73 },
    { offset: 0.605, color: '#74787D', opacity: 0.76 },
    { offset: 0.615, color: '#7C7F85', opacity: 0.88 },
    { offset: 0.625, color: '#8A8E93', opacity: 0.99 },
    { offset: 0.6317, color: '#999CA1', opacity: 1 },
    { offset: 0.645, color: '#C1C4C8', opacity: 1 },
    { offset: 0.6517, color: '#CCCFD3', opacity: 1 },
    { offset: 0.6583, color: '#D1D3D7', opacity: 1 },
    { offset: 0.665, color: '#D2D5D8', opacity: 1 },
    { offset: 0.6783, color: '#CCCFD3', opacity: 1 },
    { offset: 0.6817, color: '#CDD0D4', opacity: 1 },
    { offset: 0.6983, color: '#DCDEE2', opacity: 1 },
    { offset: 0.7117, color: '#E5E7EA', opacity: 1 },
    { offset: 0.7317, color: '#EDEFF2', opacity: 1 },
    { offset: 0.7517, color: '#EEF0F3', opacity: 1 },
    { offset: 0.785, color: '#DEE1E4', opacity: 1 },
    { offset: 0.8417, color: '#CED1D5', opacity: 1 },
    { offset: 0.9383, color: '#C4C7CB', opacity: 1 },
    { offset: 1, color: '#CBCDD1', opacity: 1 }
  ]
}

// Fixed, not theme colors: the frames glow white in both themes
const CORNER_COLOR = '#FFFFFF'
const CORNER_GLOW_BLUR = 4
const CORNER_INSET = 6
/** As in the design: the frames curve a bit wider than the illustration's own corners */
const CORNER_RADIUS = 14

const FRAME_STYLE: ViewStyle = {
  width: '100%',
  height: HEIGHT,
  borderRadius: BORDER_RADIUS_SECONDARY,
  overflow: 'hidden'
}
// In percent of the illustration, so the ray scales with it without measuring it
const RAY_LAYER_STYLE = {
  position: 'absolute',
  top: 0,
  left: 0,
  height: HEIGHT,
  width: `${(RAY_WIDTH / DESIGN_WIDTH) * 100}%`,
  transitionProperty: 'transform',
  transitionDuration: '400ms',
  // Moving it only recomposites the ray rather than repainting it every frame
  willChange: 'transform'
} as ViewStyle

// A `url(#id)` reference resolves to the first matching id in the document
let gradientIdCounter = 0

interface Props {
  /**
   * How far along the guide its step is, from 0 on the first step to 1 on the last. The ray
   * slides from right to left with it, so the light falls differently on every step.
   */
  progress: number
  /** Centered on the illustration */
  children: ReactNode
}

/**
 * The illustration card of a step of the Privacy Pools guide: a light ray over the theme's
 * background, with glowing frames in its corners. Every step renders it in the same place, so the
 * same instance stays mounted and the ray slides to the new step's place.
 */
const PrivacyPoolsGuideIllustration = ({ progress, children }: Props) => {
  const { theme } = useTheme()
  const [ids] = useState(() => {
    gradientIdCounter += 1
    return {
      main: `privacy-pools-guide-main-ray-${gradientIdCounter}`,
      second: `privacy-pools-guide-second-ray-${gradientIdCounter}`
    }
  })
  // A transform's percentages are of the ray's own width
  const rayStyle: ViewStyle = { transform: [{ translateX: `${-progress * RAY_TRAVEL}%` }] }

  return (
    <View style={[FRAME_STYLE, { backgroundColor: theme.secondaryBackground }]}>
      <View style={[RAY_LAYER_STYLE, rayStyle]}>
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${RAY_WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
        >
          <Defs>
            <LinearGradient
              id={ids.main}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={0}
              x2={MAIN_RAY.end.x}
              y2={MAIN_RAY.end.y}
            >
              {MAIN_RAY.stops.map(({ offset, color }) => (
                <Stop key={offset} offset={offset} stopColor={color} />
              ))}
            </LinearGradient>
            <LinearGradient
              id={ids.second}
              gradientUnits="userSpaceOnUse"
              x1={0}
              y1={0}
              x2={SECOND_RAY.end.x}
              y2={SECOND_RAY.end.y}
            >
              {SECOND_RAY.stops.map(({ offset, color, opacity }) => (
                <Stop key={offset} offset={offset} stopColor={color} stopOpacity={opacity} />
              ))}
            </LinearGradient>
          </Defs>
          {/* Both rays at once at the design's opacity, so the second covers the first */}
          <G opacity={RAY_OPACITY}>
            <Rect width={RAY_WIDTH} height={HEIGHT} fill={`url(#${ids.main})`} />
            <Rect width={RAY_WIDTH} height={HEIGHT} fill={`url(#${ids.second})`} />
          </G>
        </Svg>
      </View>
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
