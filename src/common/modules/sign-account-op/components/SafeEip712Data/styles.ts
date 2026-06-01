import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  content: ViewStyle
  rows: ViewStyle
  row: ViewStyle
  value: TextStyle
  expandedContent: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      borderWidth: 1,
      borderColor: theme.secondaryBorder
    },
    content: {
      ...spacings.phSm
    },
    rows: {
      ...flexbox.flex1
    },
    row: {
      ...flexbox.directionRow,
      ...flexbox.wrap,
      ...spacings.pvMi
    },
    value: {
      flexShrink: 1
    },
    expandedContent: {
      borderTopWidth: 1,
      borderTopColor: theme.secondaryBorder,
      ...spacings.pSm,
      ...common.borderRadiusPrimary
    }
  })

export default getStyles
