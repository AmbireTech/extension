import React from 'react'
import { ColorValue, View, ViewStyle } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import flexbox from '@common/styles/utils/flexbox'

import {
  OVERVIEW_CARD_GAP as CARD_GAP,
  OVERVIEW_CARD_INSET_STYLE,
  OVERVIEW_CARD_RADIUS as RADIUS
} from './DashboardOverview'

/** How far above the top of the pages the cover reaches. */
export const OVERVIEW_COLLAPSE_COVER_HEIGHT = CARD_GAP + RADIUS

const CORNER_STYLE: ViewStyle = { width: RADIUS, height: RADIUS, overflow: 'hidden' }

// A ring whose hole is the card's rounded corner and whose border fills the rest of the square
const getRingStyle = (side: 'left' | 'right', color: ColorValue): ViewStyle => ({
  position: 'absolute',
  width: RADIUS * 4,
  height: RADIUS * 4,
  borderRadius: RADIUS * 2,
  borderWidth: RADIUS,
  borderColor: color,
  top: -RADIUS * 2,
  left: side === 'left' ? -RADIUS : -RADIUS * 2
})

/**
 * Rides on top of the pages as they slide over the collapsing part of the overview card,
 * filling the gap below the card and rounding its bottom corners wherever it is cut off.
 * Lines up with the card's own corners once it is fully open.
 */
const OverviewCollapseCover = () => {
  const { theme } = useTheme()

  return (
    <View pointerEvents="none" style={{ height: OVERVIEW_COLLAPSE_COVER_HEIGHT }}>
      <View style={[flexbox.directionRow, flexbox.justifySpaceBetween, OVERVIEW_CARD_INSET_STYLE]}>
        <View style={CORNER_STYLE}>
          <View style={getRingStyle('left', theme.primaryBackground)} />
        </View>
        <View style={CORNER_STYLE}>
          <View style={getRingStyle('right', theme.primaryBackground)} />
        </View>
      </View>
      <View style={{ height: CARD_GAP, backgroundColor: theme.primaryBackground }} />
    </View>
  )
}

export default React.memo(OverviewCollapseCover)
