import React from 'react'
import { View } from 'react-native'

import flexbox from '@common/styles/utils/flexbox'

import { DashboardPagesCarouselProps } from './DashboardPagesCarousel'

// On web every page renders its own tabs row as a sticky list header and only the
// open one is visible, so there is nothing to swipe between.
const DashboardPagesCarousel: React.FC<DashboardPagesCarouselProps> = ({ children }) => (
  <View style={flexbox.flex1}>{children}</View>
)

export default React.memo(DashboardPagesCarousel)
