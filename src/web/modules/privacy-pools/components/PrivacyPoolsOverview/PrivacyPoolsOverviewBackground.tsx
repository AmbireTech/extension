import React from 'react'
import { Image, ImageSourcePropType, StyleSheet, View, ViewStyle } from 'react-native'
import { Defs, FeGaussianBlur, Filter, Path, Svg } from 'react-native-svg'

import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

import backgroundImage from './background.jpg'

// Fixed, not theme colors: the card is dark in both themes, like the regular one
const GLOW_COLOR = '#FF955C'

const CORNER_SIZE = 32
/** Moves each corner frame as far from the card's edges as in the design. */
const CORNER_OFFSET_SIDE = -3.75
const CORNER_OFFSET_TOP = -4.75
const CORNER_OFFSET_BOTTOM = -3.75
const TOP_LEFT_CORNER_PATH = 'M8.75 24.75V16.75C8.75 12.3317 12.3317 8.75 16.75 8.75H24.75'

const CORNERS: { id: string; style: ViewStyle }[] = [
  { id: 'top-left', style: { left: CORNER_OFFSET_SIDE, top: CORNER_OFFSET_TOP } },
  {
    id: 'top-right',
    style: { right: CORNER_OFFSET_SIDE, top: CORNER_OFFSET_TOP, transform: [{ scaleX: -1 }] }
  },
  {
    id: 'bottom-left',
    style: { left: CORNER_OFFSET_SIDE, bottom: CORNER_OFFSET_BOTTOM, transform: [{ scaleY: -1 }] }
  },
  {
    id: 'bottom-right',
    style: {
      right: CORNER_OFFSET_SIDE,
      bottom: CORNER_OFFSET_BOTTOM,
      transform: [{ scaleX: -1 }, { scaleY: -1 }]
    }
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
    {CORNERS.map(({ id, style }) => (
      <Svg
        key={id}
        width={CORNER_SIZE}
        height={CORNER_SIZE}
        viewBox={`0 0 ${CORNER_SIZE} ${CORNER_SIZE}`}
        fill="none"
        style={[{ position: 'absolute' }, style]}
      >
        <Defs>
          <Filter id={`privacy-pools-corner-glow-${id}`}>
            <FeGaussianBlur stdDeviation="4" />
          </Filter>
        </Defs>
        <Path
          d={TOP_LEFT_CORNER_PATH}
          stroke={GLOW_COLOR}
          strokeWidth={1.5}
          filter={`url(#privacy-pools-corner-glow-${id})`}
        />
        <Path d={TOP_LEFT_CORNER_PATH} stroke={GLOW_COLOR} strokeWidth={1.5} />
      </Svg>
    ))}
  </View>
)

export default React.memo(PrivacyPoolsOverviewBackground)
