import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 16,
      height: 32,
      paddingHorizontal: 2
    }
  })

export default getStyles
