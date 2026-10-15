import React, { useEffect, useRef } from 'react'
import { Animated, Easing } from 'react-native'
import { Defs, FeGaussianBlur, Filter, G, LinearGradient, Path, Stop, Svg } from 'react-native-svg'

import {
  GRADIENT_CYAN,
  GRADIENT_PURPLE,
  PILL_ASSET_HEIGHT,
  PILL_ASSET_WIDTH,
  PILL_FILL
} from './constants'

const AnimatedPath = Animated.createAnimatedComponent(Path)

// Standard circle-to-bezier approximation constant (same one design tools use to export
// a rounded rect's corners as cubic curves), so a stadium/pill shape's outline can be
// generated for any width/height instead of hand-recomputing curve coordinates by hand
// every time the asset's size changes.
const KAPPA = 0.5522847498

// Builds a stadium (fully-rounded-ends) pill outline: `inset` pulls the shape in from
// the SVG canvas edges (room for the glow to bleed into), and the two ends are perfect
// semicircles of radius `height / 2 - inset`. `startAtTopLeft` matches the reference
// design's stroke path, which is drawn starting at the top-left corner instead of the
// left-mid point the fill path starts at - same outline, different starting point/winding.
function buildPillPath(width: number, height: number, inset: number, startAtTopLeft = false) {
  const radius = height / 2 - inset
  const k = KAPPA * radius
  const left = inset
  const right = width - inset
  const top = inset
  const bottom = height - inset
  const leftCapEnd = left + radius
  const rightCapStart = right - radius
  const midY = height / 2

  const topLeftArc = `C${left} ${midY - k} ${leftCapEnd - k} ${top} ${leftCapEnd} ${top}`
  const topRightArc = `C${rightCapStart + k} ${top} ${right} ${midY - k} ${right} ${midY}`
  const bottomRightArc = `C${right} ${midY + k} ${rightCapStart + k} ${bottom} ${rightCapStart} ${bottom}`
  const bottomLeftArc = `C${leftCapEnd - k} ${bottom} ${left} ${midY + k} ${left} ${midY}`

  if (startAtTopLeft) {
    return `M${leftCapEnd} ${top}H${rightCapStart}${topRightArc}${bottomRightArc}H${leftCapEnd}${bottomLeftArc}${topLeftArc}Z`
  }

  return `M${left} ${midY}${topLeftArc}H${rightCapStart}${topRightArc}${bottomRightArc}H${leftCapEnd}${bottomLeftArc}Z`
}

const PILL_FILL_PATH = buildPillPath(PILL_ASSET_WIDTH, PILL_ASSET_HEIGHT, 6)
const PILL_STROKE_PATH = buildPillPath(PILL_ASSET_WIDTH, PILL_ASSET_HEIGHT, 6.5, true)

// One gradient direction per animation step, spanning the pill's inset edges/mid-lines
// (same 4 directions as the reference design's keyframe SVGs: left->right, top->bottom,
// right->left, bottom->top), scaled to the asset's actual size.
const GRADIENT_STEPS = [
  {
    x1: '6',
    y1: `${PILL_ASSET_HEIGHT / 2}`,
    x2: `${PILL_ASSET_WIDTH - 6}`,
    y2: `${PILL_ASSET_HEIGHT / 2}`
  },
  {
    x1: `${PILL_ASSET_WIDTH / 2}`,
    y1: '6',
    x2: `${PILL_ASSET_WIDTH / 2}`,
    y2: `${PILL_ASSET_HEIGHT - 6}`
  },
  {
    x1: `${PILL_ASSET_WIDTH - 6}`,
    y1: `${PILL_ASSET_HEIGHT / 2}`,
    x2: '6',
    y2: `${PILL_ASSET_HEIGHT / 2}`
  },
  {
    x1: `${PILL_ASSET_WIDTH / 2}`,
    y1: `${PILL_ASSET_HEIGHT - 6}`,
    x2: `${PILL_ASSET_WIDTH / 2}`,
    y2: '6'
  }
]

const STEP_DURATION = 1500

// Each step's opacity ramps up to 1 as it becomes "current" and back down to 0 as the next
// step takes over, crossfading continuously between the 4 gradient directions and wrapping
// seamlessly from step 3 back to step 0 (progress 4 === progress 0).
const OPACITY_INTERPOLATIONS: { inputRange: number[]; outputRange: number[] }[] = [
  { inputRange: [0, 1, 3, 4], outputRange: [1, 0, 0, 1] },
  { inputRange: [0, 1, 2, 4], outputRange: [0, 1, 0, 0] },
  { inputRange: [0, 1, 2, 3, 4], outputRange: [0, 0, 1, 0, 0] },
  { inputRange: [0, 2, 3, 4], outputRange: [0, 0, 1, 0] }
]

const AnimatedGradientBorder = () => {
  const progress = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(progress, {
        toValue: GRADIENT_STEPS.length,
        duration: STEP_DURATION * GRADIENT_STEPS.length,
        easing: Easing.linear,
        // Animating SVG gradient/opacity props, not a transform - not eligible for the native driver.
        useNativeDriver: false
      })
    )
    animation.start()

    return () => animation.stop()
  }, [progress])

  const opacities = OPACITY_INTERPOLATIONS.map(({ inputRange, outputRange }) =>
    progress.interpolate({ inputRange, outputRange, extrapolate: 'clamp' })
  )

  return (
    <Svg
      width={PILL_ASSET_WIDTH}
      height={PILL_ASSET_HEIGHT}
      viewBox={`0 0 ${PILL_ASSET_WIDTH} ${PILL_ASSET_HEIGHT}`}
    >
      <Defs>
        {GRADIENT_STEPS.map((direction, i) => (
          <LinearGradient
            key={`gradient-${i}`}
            id={`mobileAppBannerGradient${i}`}
            x1={direction.x1}
            y1={direction.y1}
            x2={direction.x2}
            y2={direction.y2}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0" stopColor={GRADIENT_CYAN} />
            <Stop offset="1" stopColor={GRADIENT_PURPLE} />
          </LinearGradient>
        ))}
        <Filter id="mobileAppBannerGlow" x="-50%" y="-50%" width="200%" height="200%">
          <FeGaussianBlur stdDeviation="3" />
        </Filter>
      </Defs>

      <Path d={PILL_FILL_PATH} fill={PILL_FILL} />

      {GRADIENT_STEPS.map((_, i) => (
        <G key={`glow-${i}`} filter="url(#mobileAppBannerGlow)">
          <AnimatedPath
            d={PILL_STROKE_PATH}
            stroke={`url(#mobileAppBannerGradient${i})`}
            opacity={opacities[i]}
          />
        </G>
      ))}
      {GRADIENT_STEPS.map((_, i) => (
        <AnimatedPath
          key={`stroke-${i}`}
          d={PILL_STROKE_PATH}
          stroke={`url(#mobileAppBannerGradient${i})`}
          opacity={opacities[i]}
        />
      ))}
    </Svg>
  )
}

export default React.memo(AnimatedGradientBorder)
