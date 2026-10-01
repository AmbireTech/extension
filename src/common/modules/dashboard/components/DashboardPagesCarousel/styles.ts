import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

import { OVERVIEW_COLLAPSE_COVER_HEIGHT } from '../DashboardOverview/OverviewCollapseCover'

interface Style {
  container: ViewStyle
  header: ViewStyle
  slider: ViewStyle
  collapseCover: ViewStyle
  pullSpinner: ViewStyle
  pullSpinnerIcon: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.flex1
    },
    slider: {
      ...StyleSheet.absoluteFillObject,
      // Clips the banners once they are scrolled past the top of the pages
      overflow: 'hidden',
      backgroundColor: theme.primaryBackground
    },
    // Reaches above the pages, so it cannot be inside the slider, which clips them
    collapseCover: {
      position: 'absolute',
      top: -OVERVIEW_COLLAPSE_COVER_HEIGHT,
      left: 0,
      right: 0
    },
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.primaryBackground
    },
    pullSpinner: {
      position: 'absolute',
      left: 0,
      right: 0,
      // Only ever as tall as the gap the pages have opened, so it is revealed rather
      // than drawn over them
      overflow: 'hidden',
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter
    },
    pullSpinnerIcon: {
      width: 28,
      height: 28
    }
  })

export default getStyles
