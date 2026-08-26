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
  cardIcon: ViewStyle
  cardContent: ViewStyle
  cardHumanization: ViewStyle
  cardMetadata: ViewStyle
  metadataItem: ViewStyle
  metadataText: TextStyle
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
      ...flexbox.directionRow,
      ...flexbox.alignStart,
      ...spacings.phSm,
      ...spacings.pvSm,
      ...spacings.mbSm,
      borderWidth: 1,
      borderColor: theme.primaryBorder,
      borderRadius: BORDER_RADIUS_PRIMARY,
      backgroundColor: theme.primaryBackground
    },
    cardIcon: {
      ...spacings.mrSm,
      flexShrink: 0
    },
    cardContent: {
      ...flexbox.flex1,
      minWidth: 0
    },
    cardHumanization: {
      ...spacings.mtSm,
      ...spacings.phTy,
      ...spacings.pvTy,
      borderWidth: 1,
      borderColor: theme.primaryBorder,
      borderRadius: BORDER_RADIUS_PRIMARY,
      backgroundColor: theme.secondaryBackground,
      overflow: 'hidden'
    },
    cardMetadata: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.wrap,
      ...spacings.mtSm
    },
    metadataItem: {
      ...spacings.phTy,
      ...spacings.pvMi,
      ...spacings.mrTy,
      ...spacings.mbMi,
      borderRadius: BORDER_RADIUS_PRIMARY,
      backgroundColor: theme.secondaryBackground,
      maxWidth: '100%'
    },
    metadataText: {
      maxWidth: '100%'
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
