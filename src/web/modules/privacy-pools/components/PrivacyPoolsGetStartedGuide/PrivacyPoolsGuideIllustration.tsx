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
 * The design's shader over the ray ("Hatching") paints it between a dark and a light grey by how
 * bright the ray is, a row per red, green and blue
 */
const SHADER_GREYS = [
  { dark: 69, light: 242 },
  { dark: 74, light: 244 },
  { dark: 80, light: 247 }
]

interface Streak {
  /** Where across the ray it is, from 0 to 1 */
  at: number
  width: number
  /** How far it lights the ray from the shader's dark grey towards its light one */
  brightness: number
}

interface Ray {
  /** Where the line across the streaks ends, from the ray's top-left corner */
  end: { x: number; y: number }
  /** How bright the ray is between its streaks */
  base: number
  streaks: Streak[]
  /** Where across the ray it fades in, over the one below it */
  fadeIn?: { from: number; to: number }
}

/**
 * The design's light ray image has two rays, their streaks at slightly different angles, so each
 * is a gradient of its own, read across its streaks. Described by their streaks, as read from the
 * design's image, instead of the image, so no image or shader is shipped for it.
 */
const MAIN_RAY: Ray = {
  /** The narrow ray, 34° down from the horizontal, with the dark area left of it */
  end: { x: 411.3, y: 277.4 },
  base: 0.14,
  streaks: [
    { at: 0, width: 0.034, brightness: 0.67 },
    { at: 0.375, width: 0.012, brightness: 0.06 },
    { at: 0.45, width: 0.005, brightness: 0.34 },
    { at: 0.472, width: 0.016, brightness: 0.48 },
    { at: 0.506, width: 0.032, brightness: 0.61 }
  ]
}
const SECOND_RAY: Ray = {
  /** The wide ray right of the main one, 42° down, drawn over it from the dark gap between them */
  end: { x: 357.9, y: 322.3 },
  base: 0.22,
  fadeIn: { from: 0.54, to: 0.626 },
  streaks: [
    { at: 0.654, width: 0.017, brightness: 0.31 },
    { at: 0.715, width: 0.043, brightness: 0.43 },
    { at: 0.792, width: 0.063, brightness: 0.29 },
    { at: 1, width: 0.181, brightness: 0.54 }
  ]
}

/** Enough for the narrowest streak to keep its shape */
const STOPS_PER_RAY = 100

/** The ray as gradient stops: its streaks summed up, in the shader's greys */
const getRayStops = ({ base, streaks, fadeIn }: Ray) =>
  Array.from({ length: STOPS_PER_RAY + 1 }, (_, index) => {
    const offset = index / STOPS_PER_RAY
    const brightness = Math.min(
      1,
      streaks.reduce(
        (sum, streak) =>
          sum + streak.brightness * Math.exp(-0.5 * ((offset - streak.at) / streak.width) ** 2),
        base
      )
    )
    const channels = SHADER_GREYS.map(({ dark, light }) =>
      Math.round(dark + (light - dark) * brightness)
    )
    const opacity = fadeIn
      ? Math.min(1, Math.max(0, (offset - fadeIn.from) / (fadeIn.to - fadeIn.from)))
      : 1

    return { offset, color: `rgb(${channels.join(', ')})`, opacity }
  })

const MAIN_RAY_STOPS = getRayStops(MAIN_RAY)
const SECOND_RAY_STOPS = getRayStops(SECOND_RAY)

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
              {MAIN_RAY_STOPS.map(({ offset, color }) => (
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
              {SECOND_RAY_STOPS.map(({ offset, color, opacity }) => (
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
