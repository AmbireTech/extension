import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  summary: ViewStyle
  summaryContent: ViewStyle
  compactSummaryContent: ViewStyle
  iconStack: ViewStyle
  summaryIcon: ViewStyle
  card: ViewStyle
  cardHeader: ViewStyle
  cardHeaderLeft: ViewStyle
  cardIcon: ViewStyle
  cardTitle: TextStyle
  cardDescription: TextStyle
  cardHumanization: ViewStyle
  cardNetwork: ViewStyle
  sheetHeader: ViewStyle
  closeButton: ViewStyle
  openButton: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    summary: {
      ...common.borderRadiusPrimary,
      ...flexbox.center,
      ...spacings.phSm,
      ...spacings.ptMi,
      ...spacings.pbMi,
      minHeight: 44,
      backgroundColor: theme.primaryBackground,
      borderWidth: 1,
      borderColor: theme.primaryBorder,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderTopWidth: 0,
      marginTop: -8
    },
    summaryContent: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...flexbox.wrap
    },
    compactSummaryContent: {
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter
    },
    iconStack: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.mrTy
    },
    summaryIcon: {
      borderWidth: 2,
      borderColor: theme.primaryBackground,
      borderRadius: 12,
      overflow: 'hidden'
    },
    card: {
      ...spacings.phSm,
      ...spacings.pvTy,
      ...spacings.mbSm,
      borderWidth: 1,
      borderColor: theme.primaryBorder,
      borderRadius: BORDER_RADIUS_PRIMARY,
      backgroundColor: theme.primaryBackground
    },
    cardHeader: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.mbMi,
      width: '100%'
    },
    cardHeaderLeft: {
      ...flexbox.flex1,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      minWidth: 0
    },
    cardIcon: {
      ...spacings.mrTy,
      flexShrink: 0
    },
    cardTitle: {
      flexShrink: 1
    },
    cardDescription: {
      width: '100%'
    },
    cardHumanization: {
      ...spacings.mtSm,
      ...spacings.phTy,
      ...spacings.pvTy,
      borderWidth: 1,
      borderColor: theme.primaryBorder,
      borderRadius: BORDER_RADIUS_PRIMARY,
      backgroundColor: theme.secondaryBackground,
      overflow: 'hidden',
      width: '100%'
    },
    cardNetwork: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.mtSm,
      minWidth: 0,
      width: '100%'
    },
    sheetHeader: {
      ...flexbox.directionRow,
      ...flexbox.alignStart,
      ...flexbox.justifySpaceBetween,
      ...spacings.mbLg
    },
    closeButton: {
      ...flexbox.center,
      width: 32,
      height: 32,
      flexShrink: 0
    },
    openButton: {
      ...flexbox.center,
      minWidth: 48,
      minHeight: 44,
      ...spacings.mlTy,
      flexShrink: 0
    }
  })

export default getStyles
