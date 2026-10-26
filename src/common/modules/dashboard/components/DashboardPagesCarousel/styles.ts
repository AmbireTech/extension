import { StyleSheet, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

import { OVERVIEW_COLLAPSE_COVER_HEIGHT } from '../DashboardOverview/OverviewCollapseCover'

/**
 * Web only: keeps a view moved by a transform every frame on a layer of its own, so moving it
 * only recomposites it rather than repainting it - and everything in it - each frame.
 */
export const WEB_MOVING_LAYER = isWeb ? ({ willChange: 'transform' } as ViewStyle) : {}

interface Style {
  container: ViewStyle
  header: ViewStyle
  slider: ViewStyle
  collapseCover: ViewStyle
  floatingBar: ViewStyle
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
      ...WEB_MOVING_LAYER,
      // Clips the banners once they are scrolled past the top of the pages
      overflow: 'hidden',
      backgroundColor: theme.primaryBackground
    },
    // Reaches above the pages, so it cannot be inside the slider, which clips them
    collapseCover: {
      ...WEB_MOVING_LAYER,
      position: 'absolute',
      top: -OVERVIEW_COLLAPSE_COVER_HEIGHT,
      left: 0,
      right: 0
    },
    // Moves the floating bar, which positions itself against the bottom of it
    floatingBar: {
      ...StyleSheet.absoluteFillObject,
      ...WEB_MOVING_LAYER
    },
    header: {
      ...WEB_MOVING_LAYER,
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
