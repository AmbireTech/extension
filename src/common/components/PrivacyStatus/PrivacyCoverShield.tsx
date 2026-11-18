import React, { FC } from 'react'
import { ColorValue } from 'react-native'
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg'

import useTheme from '@common/hooks/useTheme'

type Props = {
  cover: number
  /** The dot of the user, which carries the severity color. */
  youColor: ColorValue
  width?: number
  height?: number
}

const VIEWBOX_WIDTH = 56
const VIEWBOX_HEIGHT = 64
const YOU_X = 28
const YOU_Y = 30
const DOT_GAP = 6.2
const DOT_ROW_GAP = (DOT_GAP * Math.sqrt(3)) / 2
const DOT_RADIUS = 1.3
const DOT_EDGE_MARGIN = 2
const LIT_DOT_OPACITY = 0.75
const LIT_DOT_FADE = 0.4
const UNLIT_DOT_OPACITY = 0.13
const SHIELD_PATH =
  'M28 2.5C33 5.5 42 8 51.5 8.5C52.6 8.6 53.5 9.6 53.5 10.7V29C53.5 45 43 55.5 28 61.5C13 55.5 2.5 45 2.5 29V10.7C2.5 9.6 3.4 8.6 4.5 8.5C14 8 23 5.5 28 2.5Z'
// The inner area of the shield path, used to keep whole dots inside it
const SHIELD_INNER_HALF_WIDTH = 21
const SHIELD_INNER_TOP = 10
const SHIELD_INNER_BOTTOM = 56
const SHIELD_CURVE_START = 29
const SHIELD_CURVE_END = 57.5
const GLOW_ID = 'privacy-cover-shield-glow'
const STROKE_ID = 'privacy-cover-shield-stroke'

const getShieldHalfWidth = (y: number): number => {
  if (y < SHIELD_INNER_TOP || y > SHIELD_INNER_BOTTOM) return 0
  if (y <= SHIELD_CURVE_START) return SHIELD_INNER_HALF_WIDTH

  const curveProgress = (y - SHIELD_CURVE_START) / (SHIELD_CURVE_END - SHIELD_CURVE_START)

  return SHIELD_INNER_HALF_WIDTH * Math.sqrt(Math.max(0, 1 - curveProgress ** 2))
}

/** The other deposits as a honeycomb of dots inside the shield, nearest to the user first. */
const getDepositDots = () => {
  const dots: { id: string; x: number; y: number; distance: number }[] = []

  for (let row = -4; row <= 5; row++) {
    for (let column = -5; column <= 5; column++) {
      const x = YOU_X + column * DOT_GAP + (Math.abs(row) % 2 ? DOT_GAP / 2 : 0)
      const y = YOU_Y + row * DOT_ROW_GAP
      const isYou = row === 0 && column === 0
      const fitsShield = Math.abs(x - YOU_X) + DOT_RADIUS + DOT_EDGE_MARGIN <= getShieldHalfWidth(y)

      if (!isYou && fitsShield)
        dots.push({ id: `${row}:${column}`, x, y, distance: Math.hypot(x - YOU_X, y - YOU_Y) })
    }
  }

  return dots.sort((a, b) => a.distance - b.distance)
}

const DEPOSIT_DOTS = getDepositDots()
const FARTHEST_DOT_DISTANCE = Math.max(...DEPOSIT_DOTS.map(({ distance }) => distance))

/**
 * A shield filled with dots around the user's own dot. One dot lights up for each deposit that
 * covers the user, nearest first, so a weak cover leaves most of the shield dark.
 */
const PrivacyCoverShield: FC<Props> = ({ cover, youColor, width = 49, height = 56 }) => {
  const { theme } = useTheme()

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}>
      <Defs>
        <RadialGradient id={GLOW_ID} cx="50%" cy="47%" r="50%">
          <Stop offset="0" stopColor={theme.primaryText} stopOpacity={0.1} />
          <Stop offset="1" stopColor={theme.primaryText} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={STROKE_ID} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={theme.primaryText} stopOpacity={0.55} />
          <Stop offset="1" stopColor={theme.primaryText} stopOpacity={0.08} />
        </LinearGradient>
      </Defs>
      <Path
        d={SHIELD_PATH}
        fill={`url(#${GLOW_ID})`}
        stroke={`url(#${STROKE_ID})`}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      {DEPOSIT_DOTS.map(({ id, x, y, distance }, index) => (
        <Circle
          key={id}
          cx={x}
          cy={y}
          r={DOT_RADIUS}
          fill={theme.primaryText}
          opacity={
            index < cover
              ? LIT_DOT_OPACITY - LIT_DOT_FADE * (distance / FARTHEST_DOT_DISTANCE)
              : UNLIT_DOT_OPACITY
          }
        />
      ))}
      <Circle
        cx={YOU_X}
        cy={YOU_Y}
        r={3.6}
        fill="none"
        stroke={youColor}
        strokeOpacity={0.5}
        strokeWidth={0.8}
      />
      <Circle cx={YOU_X} cy={YOU_Y} r={1.8} fill={youColor} />
    </Svg>
  )
}

export default React.memo(PrivacyCoverShield)
