import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  filterButton: ViewStyle
  filterButtonHovered: ViewStyle
  filterButtonActive: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
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
      backgroundColor: theme.primaryLight,
      borderColor: theme.primaryLight
    }
  })

export default getStyles
