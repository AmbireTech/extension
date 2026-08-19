import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
import spacings, { SPACING, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  cardWrapper: ViewStyle
  card: ViewStyle
  cardContent: ViewStyle
  cardHeader: ViewStyle
  cardTitleWrapper: ViewStyle
  cardDescription: TextStyle
  iconFallback: ViewStyle
  sheetContent: ViewStyle
  learnMore: ViewStyle
  tabs: ViewStyle
  tab: ViewStyle
  activeTab: ViewStyle
  amountCard: ViewStyle
  balanceRow: ViewStyle
  amountInput: ViewStyle
  amountInputWrapper: ViewStyle
  amountNativeInput: TextStyle
  percentages: ViewStyle
  percentageButton: ViewStyle
  details: ViewStyle
  detailRow: ViewStyle
  footer: ViewStyle
  footerButton: ViewStyle
  validation: TextStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    cardWrapper: {
      ...spacings.mbTy,
      flex: 1
    },
    card: {
      ...common.borderRadiusPrimary,
      borderWidth: 1,
      borderLeftColor: theme.secondaryAccent300,
      borderTopColor: theme.secondaryAccent300,
      borderRightColor: theme.primaryAccent200,
      borderBottomColor: theme.primaryAccent200,
      overflow: 'hidden'
    },
    cardContent: {
      ...spacings.phSm,
      ...spacings.pvSm,
      backgroundColor: theme.secondaryBackground
    },
    cardHeader: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.mbSm
    },
    cardTitleWrapper: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...flexbox.flex1,
      minWidth: 0
    },
    cardDescription: {
      lineHeight: 18
    },
    iconFallback: {
      ...flexbox.center,
      width: 40,
      height: 40,
      backgroundColor: theme.primaryBackground,
      borderRadius: 8
    },
    sheetContent: {
      minHeight: isMobile ? 500 : 470,
      ...flexbox.justifySpaceBetween
    },
    learnMore: {
      ...flexbox.directionRow,
      ...flexbox.justifyCenter,
      ...flexbox.wrap,
      ...spacings.mbXl
    },
    tabs: {
      ...flexbox.directionRow,
      ...flexbox.justifyCenter,
      ...spacings.mb2Xl,
      columnGap: SPACING_TY
    },
    tab: {
      ...spacings.phSm,
      ...spacings.pbTy,
      borderBottomWidth: 2,
      borderBottomColor: theme.secondaryBorder
    },
    activeTab: {
      borderBottomColor: theme.primaryText
    },
    amountCard: {
      ...spacings.phSm,
      ...spacings.pvSm,
      ...spacings.mbLg,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 16
    },
    balanceRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.mbTy,
      minHeight: 20
    },
    amountInput: {
      ...spacings.mbSm
    },
    amountInputWrapper: {
      height: 48,
      ...spacings.phSm,
      backgroundColor: theme.tertiaryBackground,
      borderRadius: 14,
      borderWidth: 0
    },
    amountNativeInput: {
      color: theme.primaryText,
      fontSize: 16,
      textAlign: 'left'
    },
    percentages: {
      ...flexbox.directionRow,
      columnGap: SPACING_TY
    },
    percentageButton: {
      ...flexbox.flex1,
      height: 34,
      ...spacings.mb0,
      ...spacings.phTy,
      borderRadius: 20,
      backgroundColor: theme.primaryBackground
    },
    details: {
      ...spacings.phSm
    },
    detailRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.mbSm,
      columnGap: SPACING
    },
    footer: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.alignSelfCenter,
      ...spacings.phTy,
      ...spacings.pvTy,
      ...spacings.mt2Xl,
      minWidth: 230,
      maxWidth: 320,
      width: '75%',
      columnGap: SPACING_SM,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.primaryBorder,
      backgroundColor: theme.secondaryBackground
    },
    footerButton: {
      ...flexbox.flex1,
      ...spacings.mb0,
      height: 48,
      borderRadius: 18
    },
    validation: {
      ...spacings.mtTy,
      ...spacings.mlSm,
      minHeight: 16
    }
  })

export default getStyles
