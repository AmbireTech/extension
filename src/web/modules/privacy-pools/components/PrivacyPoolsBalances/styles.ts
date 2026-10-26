import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  centeredText: TextStyle
  container: ViewStyle
  row: ViewStyle
  emptyContainer: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...common.borderRadiusPrimary,
      ...spacings.phSm,
      backgroundColor: theme.secondaryBackground,
      overflow: 'hidden'
    },
    row: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.pvSm,
      borderBottomWidth: 1,
      borderBottomColor: theme.secondaryBorder
    },
    emptyContainer: {
      ...flexbox.alignCenter,
      ...spacings.pvLg,
      ...spacings.phSm
    },
    centeredText: {
      textAlign: 'center'
    }
  })

export default getStyles
