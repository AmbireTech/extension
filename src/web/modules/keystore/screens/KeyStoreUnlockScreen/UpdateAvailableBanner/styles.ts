import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING_TY } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  content: ViewStyle
  text: TextStyle
  arrowWrapper: ViewStyle
}

const ICON_SIZE = 24

export const UPDATE_AVAILABLE_BANNER_HEIGHT = 40

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      width: '100%',
      height: UPDATE_AVAILABLE_BANNER_HEIGHT,
      borderRadius: BORDER_RADIUS_PRIMARY,
      backgroundColor: theme.infoBackground,
      ...spacings.phTy,
      ...spacings.pvTy
    },
    content: {
      height: 24,
      gap: SPACING_TY,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.flex1
    },
    text: {
      // `Text` resets the default lineHeight whenever a custom fontSize is passed
      lineHeight: 20,
      ...flexbox.flex1
    },
    // The arrow glyph is narrow, so a square box keeps it optically centered like the sparkle icon
    arrowWrapper: {
      width: ICON_SIZE,
      height: ICON_SIZE,
      ...flexbox.center
    }
  })

export default getStyles
