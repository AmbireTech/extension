import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps, ThemeType } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  errorTextContainer: ViewStyle
  alertText: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    // AlertVertical lays custom text out in a row, where views don't shrink by default
    errorTextContainer: {
      ...flexbox.alignCenter,
      flexShrink: 1
    },
    alertText: {
      ...flexbox.flex1,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.wrap,
      maxWidth: '100%'
    }
  })

export default getStyles
