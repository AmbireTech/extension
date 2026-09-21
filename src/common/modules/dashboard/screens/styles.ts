import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
}

export const NEUTRAL_BACKGROUND = '#1418333D'
export const NEUTRAL_BACKGROUND_HOVERED = '#14183352'
export const DASHBOARD_OVERVIEW_BACKGROUND = '#353d6e'

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.flex1,
      ...spacings.ptSm,
      // Anchors MobileAppPromoBanner's `position: 'absolute'`, so it floats within
      // this popup/side-panel/tab content box instead of an unrelated ancestor.
      position: 'relative',
      backgroundColor: theme.primaryBackground
    }
  })

export default getStyles
