import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  container: ViewStyle
  iconContainer: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    container: {
      ...flexbox.alignCenter,
      position: 'absolute',
      left: 0,
      width: '100%'
    },
    iconContainer: {
      ...flexbox.center,
      borderRadius: 25,
      width: 32,
      height: 32,
      backgroundColor: theme.secondaryBackground,
      borderColor: theme.secondaryBorder,
      borderWidth: 1
    }
  })

export default getStyles
