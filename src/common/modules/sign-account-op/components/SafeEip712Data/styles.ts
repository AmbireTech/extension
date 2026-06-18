import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  header: ViewStyle
  headerRow: ViewStyle
  expandMore: ViewStyle
  rows: ViewStyle
  row: ViewStyle
  rowRight: ViewStyle
  label: TextStyle
  value: TextStyle
  copyIcon: ViewStyle
  expandedContent: ViewStyle
  fallbackVisualization: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      borderWidth: 1,
      ...common.borderRadiusPrimary,
      borderColor: theme.primaryBorder,
      backgroundColor: theme.secondaryBackground,
      overflow: 'hidden'
    },
    header: {
      backgroundColor: 'transparent',
      ...spacings.phSm,
      ...spacings.pvTy
    },
    headerRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      width: '100%',
      minWidth: 0
    },
    expandMore: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      flexShrink: 0,
      ...spacings.mlSm
    },
    rows: {
      ...spacings.phSm,
      ...spacings.pvSm
    },
    row: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      width: '100%',
      minWidth: 0,
      ...spacings.pvMi
    },
    rowRight: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifyEnd,
      ...flexbox.flex1,
      minWidth: 0,
      ...spacings.mlTy
    },
    label: {
      flexShrink: 0
    },
    value: {
      flexShrink: 1,
      minWidth: 0,
      textAlign: 'right'
    },
    copyIcon: {
      flexShrink: 0,
      ...spacings.mlMi
    },
    expandedContent: {
      borderTopWidth: 1,
      borderTopColor: theme.secondaryBackground,
      backgroundColor: 'transparent'
    },
    fallbackVisualization: {
      backgroundColor: 'transparent',
      ...spacings.phSm,
      ...spacings.pv0
    }
  })

export default getStyles
