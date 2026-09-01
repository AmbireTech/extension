import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  header: ViewStyle
  pullSpinner: ViewStyle
  pullSpinnerIcon: ViewStyle
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
