import { StyleSheet, ViewStyle } from 'react-native'

import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Style {
  container: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    container: {
      backgroundColor: theme.secondaryBackground,
      borderWidth: themeType === THEME_TYPES.DARK ? 0 : 1,
      ...common.borderRadiusPrimary,
      borderColor: theme.secondaryBorder
    }
  })

export default getStyles
