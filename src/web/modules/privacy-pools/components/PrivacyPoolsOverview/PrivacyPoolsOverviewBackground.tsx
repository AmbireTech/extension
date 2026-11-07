import React from 'react'
import { Image, ImageSourcePropType, StyleSheet, View, ViewStyle } from 'react-native'
import { Defs, FeGaussianBlur, Filter, Path, Svg } from 'react-native-svg'

import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

import backgroundImage from './background.jpg'

// Fixed, not theme colors: the card is dark in both themes, like the regular one
const GLOW_COLOR = '#FF955C'

const CORNER_GLOW_BLUR = 4
/** Room for the corner frame and its glow, which fades out about three blurs from it */
const CORNER_SIZE = 40
/** How far each corner frame sits from the card's edges, as in the design */
const CORNER_INSET_SIDE = 5
const CORNER_INSET_TOP = 4
const CORNER_INSET_BOTTOM = 5
/** The straight part of each side of a corner frame */
const CORNER_ARM_LENGTH = 8

/**
 * The top-left corner frame, `insetX` and `insetY` from the card's edges. Its curve runs alongside
 * the card's rounded corner - same center, radius smaller by the inset - flipped for the others.
 */
const getCornerPath = (insetX: number, insetY: number) => {
  const curveEnd = BORDER_RADIUS_PRIMARY
  const armEnd = curveEnd + CORNER_ARM_LENGTH
  const radiusX = BORDER_RADIUS_PRIMARY - insetX
  const radiusY = BORDER_RADIUS_PRIMARY - insetY

  return `M${insetX} ${armEnd}V${curveEnd}A${radiusX} ${radiusY} 0 0 1 ${curveEnd} ${insetY}H${armEnd}`
}

const TOP_CORNER_PATH = getCornerPath(CORNER_INSET_SIDE, CORNER_INSET_TOP)
const BOTTOM_CORNER_PATH = getCornerPath(CORNER_INSET_SIDE, CORNER_INSET_BOTTOM)

const CORNERS: { id: string; path: string; style: ViewStyle }[] = [
  { id: 'top-left', path: TOP_CORNER_PATH, style: { left: 0, top: 0 } },
  {
    id: 'top-right',
    path: TOP_CORNER_PATH,
    style: { right: 0, top: 0, transform: [{ scaleX: -1 }] }
  },
  {
    id: 'bottom-left',
    path: BOTTOM_CORNER_PATH,
    style: { left: 0, bottom: 0, transform: [{ scaleY: -1 }] }
  },
  {
    id: 'bottom-right',
    path: BOTTOM_CORNER_PATH,
    style: { right: 0, bottom: 0, transform: [{ scaleX: -1 }, { scaleY: -1 }] }
  }
]

/**
 * Background of the Privacy Pools overview card: the same for every Privacy Pools account, unlike
 * the regular card's per-account gradient. The image is the design's hatching shader rendered
 * ahead of time, so no shader runs here.
 */
const PrivacyPoolsOverviewBackground = () => (
  <View
    style={[
      StyleSheet.absoluteFill,
      { backgroundColor: '#000000', borderRadius: BORDER_RADIUS_PRIMARY, overflow: 'hidden' }
    ]}
  >
    <Image
      source={backgroundImage as ImageSourcePropType}
      resizeMode="cover"
      style={StyleSheet.absoluteFill}
    />
    {/* The glowing edge */}
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          borderRadius: BORDER_RADIUS_PRIMARY,
          boxShadow: `inset 0 0 6px 0 ${GLOW_COLOR}, inset 0 0 3px 0 ${GLOW_COLOR}`
        }
      ]}
    />
    {CORNERS.map(({ id, path, style }) => (
      <Svg
        key={id}
        width={CORNER_SIZE}
        height={CORNER_SIZE}
        viewBox={`0 0 ${CORNER_SIZE} ${CORNER_SIZE}`}
        fill="none"
        style={[{ position: 'absolute' }, style]}
      >
        <Defs>
          {/* Over the whole corner - by default it cuts the glow off in a square near the frame */}
          <Filter
            id={`privacy-pools-corner-glow-${id}`}
            filterUnits="userSpaceOnUse"
            x={0}
            y={0}
            width={CORNER_SIZE}
            height={CORNER_SIZE}
          >
            <FeGaussianBlur stdDeviation={CORNER_GLOW_BLUR} />
          </Filter>
        </Defs>
        <Path
          d={path}
          stroke={GLOW_COLOR}
          strokeWidth={1.5}
          filter={`url(#privacy-pools-corner-glow-${id})`}
        />
        <Path d={path} stroke={GLOW_COLOR} strokeWidth={1.5} />
      </Svg>
    ))}
  </View>
)

export default React.memo(PrivacyPoolsOverviewBackground)
