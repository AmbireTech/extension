import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  filterButton: ViewStyle
  filterButtonHovered: ViewStyle
  filterButtonActive: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    filterButton: {
      borderRadius: 50,
      borderWidth: 1,
      borderColor: theme.secondaryBorder,
      ...spacings.phTy,
      height: 32,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      overflow: 'hidden'
    },
    filterButtonHovered: {
      borderColor: theme.primary,
      backgroundColor: theme.secondaryBackground
    },
    filterButtonActive: {
      backgroundColor: themeType === THEME_TYPES.DARK ? theme.primary : theme.primaryLight,
      borderColor: themeType === THEME_TYPES.DARK ? theme.primary : theme.primaryLight
    }
  })

export default getStyles
