import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'

interface Style {
  footer: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    footer: {
      ...spacings.pvMd,
      ...spacings.phMd,
      backgroundColor:
        themeType === THEME_TYPES.DARK ? theme.tertiaryBackground : theme.primaryBackground,
      shadowColor: themeType === THEME_TYPES.DARK ? '#00000052' : '#B8BDE080',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.64,
      shadowRadius: 8,
      elevation: 5,
      borderWidth: 1,
      borderColor: themeType === THEME_TYPES.DARK ? theme.primaryLight80 : theme.primary,
      borderBottomWidth: 0,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12
    }
  })

export default getStyles
