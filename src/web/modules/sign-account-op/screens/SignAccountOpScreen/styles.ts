import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  alertText: ViewStyle
  footer: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    alertText: {
      ...flexbox.flex1,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.wrap,
      maxWidth: '100%'
    },
    footer: {
      ...spacings.mt,
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
