import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

const EXPANDABLE_CARD_ARROW_WIDTH = 28

interface Style {
  container: ViewStyle
  content: ViewStyle
  contentBody: ViewStyle
  headerTile: ViewStyle
  rows: ViewStyle
  row: ViewStyle
  rowRight: ViewStyle
  label: TextStyle
  value: TextStyle
  copyIcon: ViewStyle
  expandedContent: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      borderWidth: 1,
      borderColor: theme.secondaryBorder
    },
    content: {
      ...flexbox.alignStart,
      alignItems: 'baseline',
      ...spacings.phSm
    },
    contentBody: {
      ...flexbox.flex1
    },
    headerTile: {
      alignSelf: 'flex-start',
      ...spacings.plMi
    },
    rows: {
      ...flexbox.flex1,
      marginLeft: -EXPANDABLE_CARD_ARROW_WIDTH,
      ...spacings.ptTy
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
      borderTopColor: theme.secondaryBorder,
      ...spacings.pSm,
      ...common.borderRadiusPrimary
    }
  })

export default getStyles
