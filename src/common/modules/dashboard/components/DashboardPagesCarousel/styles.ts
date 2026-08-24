import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  header: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.flex1,
      // Clips the banners once they are scrolled past the top of the carousel
      overflow: 'hidden'
    },
    header: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: theme.primaryBackground
    }
  })

export default getStyles
