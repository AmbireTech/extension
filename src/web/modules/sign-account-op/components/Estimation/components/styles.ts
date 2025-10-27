import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  gasTankIconWrapper: ViewStyle
  gasTankBadge: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    gasTankIconWrapper: {
      backgroundColor: theme.primaryBackground,
      borderRadius: 50,
      ...flexbox.center
    },
    gasTankBadge: {
      borderRadius: 50,
      backgroundColor: themeType === THEME_TYPES.DARK ? '#8B3DFF' : theme.primaryLight,
      borderColor: themeType === THEME_TYPES.DARK ? '#8B3DFF' : theme.primaryLight,
      borderWidth: 1,
      ...spacings.phMi,
      ...spacings.mlMi
    }
  })

export default getStyles
