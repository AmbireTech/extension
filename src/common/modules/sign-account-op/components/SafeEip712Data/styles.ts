import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING_SM } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  header: ViewStyle
  tabHeader: ViewStyle
  tabButton: ViewStyle
  rows: ViewStyle
  row: ViewStyle
  rowRight: ViewStyle
  label: TextStyle
  value: TextStyle
  copyIcon: ViewStyle
  fallbackVisualization: ViewStyle
  rawContainer: ViewStyle
  rawActions: ViewStyle
  rawFallbackVisualization: ViewStyle
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
    tabHeader: {
      ...flexbox.directionRow,
      alignSelf: 'stretch',
      borderBottomWidth: 1,
      borderBottomColor: theme.primaryBorder,
      ...spacings.mhSm
    },
    tabButton: {
      ...spacings.pvTy,
      ...spacings.mrTy,
      borderBottomWidth: 2
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
    fallbackVisualization: {
      backgroundColor: 'transparent',
      ...spacings.phSm,
      ...spacings.pv0
    },
    rawContainer: {
      position: 'relative'
    },
    rawActions: {
      position: 'absolute',
      top: 0,
      right: SPACING_SM,
      zIndex: 1
    },
    rawFallbackVisualization: {
      ...spacings.prXl
    }
  })

export default getStyles
