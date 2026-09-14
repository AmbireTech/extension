import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Style {
  container: ViewStyle
  row: ViewStyle
  lastRow: ViewStyle
  bar: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...common.borderRadiusPrimary,
      ...spacings.phSm,
      backgroundColor: theme.secondaryBackground,
      overflow: 'hidden'
    },
    // Not a flex row itself: a network being read adds the indeterminate bar under its own label,
    // so the row stacks vertically and only its first line is a row.
    row: {
      ...spacings.pvSm,
      borderBottomWidth: 1,
      borderBottomColor: theme.secondaryBorder
    },
    lastRow: {
      borderBottomWidth: 0
    },
    bar: {
      ...spacings.mtTy
    }
  })

export default getStyles
