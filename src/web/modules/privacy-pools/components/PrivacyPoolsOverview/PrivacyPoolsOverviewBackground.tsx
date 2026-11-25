import React from 'react'
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native'

import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import PrivacyPoolsCornerFrames from '@web/modules/privacy-pools/components/PrivacyPoolsCornerFrames'

import backgroundImage from './background.jpg'

// Fixed, not theme colors: the card is dark in both themes, like the regular one
const GLOW_COLOR = '#FF955C'

const CORNER_GLOW_BLUR = 4
/** How far each corner frame sits from the card's edges, as in the design */
const CORNER_INSET_SIDE = 5
const CORNER_INSET_TOP = 4
const CORNER_INSET_BOTTOM = 5

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
    <PrivacyPoolsCornerFrames
      color={GLOW_COLOR}
      glowBlur={CORNER_GLOW_BLUR}
      insetX={CORNER_INSET_SIDE}
      insetTop={CORNER_INSET_TOP}
      insetBottom={CORNER_INSET_BOTTOM}
      cornerRadius={BORDER_RADIUS_PRIMARY}
    />
  </View>
)

export default React.memo(PrivacyPoolsOverviewBackground)
