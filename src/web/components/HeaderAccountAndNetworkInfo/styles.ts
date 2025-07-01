import { StyleSheet, ViewStyle } from 'react-native'

import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'

interface Style {
  container: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    container: {
      borderBottomColor: theme.secondaryBorder,
      borderBottomWidth: themeType === THEME_TYPES.DARK ? 0 : 1
    }
  })

export default getStyles
