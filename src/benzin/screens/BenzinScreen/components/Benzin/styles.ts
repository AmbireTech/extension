import { ImageStyle, StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  backgroundImage: ImageStyle
  container: ViewStyle
  content: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    backgroundImage: {
      ...StyleSheet.absoluteFillObject,
      opacity: themeType === THEME_TYPES.DARK ? 0.8 : 1
    },
    container: {
      ...flexbox.flex1,
      ...flexbox.alignCenter,
      ...spacings.pv,
      ...spacings.phLg
    },
    content: {
      maxWidth: 620,
      width: '100%'
    }
  })

export default getStyles
