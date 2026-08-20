import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING, SPACING_TY } from '@common/styles/spacings'
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
  walletStakingIconWrapper: ViewStyle
  walletStakingIcon: ImageStyle
  screenContent: ViewStyle
  learnMore: ViewStyle
  tabs: ViewStyle
  tab: ViewStyle
  activeTab: ViewStyle
  emptyState: ViewStyle
  emptyIcon: ViewStyle
  emptyText: TextStyle
  buyWalletWrapper: ViewStyle
  buyWalletButton: ViewStyle
  amountCard: ViewStyle
  balanceRow: ViewStyle
  amountInput: ViewStyle
  amountInputWrapper: ViewStyle
  amountNativeInput: TextStyle
  percentages: ViewStyle
  percentageButton: ViewStyle
  details: ViewStyle
  detailRow: ViewStyle
  footerRow: ViewStyle
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
    walletStakingIconWrapper: {
      ...flexbox.center,
      width: 40,
      height: 40,
      backgroundColor: theme.primaryBackground,
      borderRadius: 8
    },
    walletStakingIcon: {
      width: 40,
      height: 40,
      borderRadius: 8
    },
    screenContent: {
      ...flexbox.flex1,
      ...flexbox.justifySpaceBetween,
      ...spacings.ph2Xl,
      ...spacings.pbSm
    },
    learnMore: {
      ...flexbox.directionRow,
      ...flexbox.justifyCenter,
      ...flexbox.wrap,
      ...spacings.mb2Xl
    },
    tabs: {
      ...flexbox.directionRow,
      ...flexbox.justifyCenter,
      ...spacings.mbXl
    },
    tab: {
      ...spacings.phSm,
      ...spacings.pbMi,
      borderBottomWidth: 2,
      borderBottomColor: theme.primaryBorder
    },
    activeTab: {
      borderBottomColor: theme.primaryText
    },
    emptyState: {
      ...flexbox.alignCenter,
      ...spacings.phMd
    },
    emptyIcon: {
      ...flexbox.center,
      ...spacings.mbLg,
      width: 78,
      height: 78,
      borderRadius: 44,
      backgroundColor: theme.infoBackground
    },
    emptyText: {
      ...spacings.mbXl,
      maxWidth: 480,
      lineHeight: 28,
      textAlign: 'center'
    },
    buyWalletWrapper: {
      ...spacings.phSm,
      ...spacings.pvSm,
      width: 170,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.primaryBorder,
      backgroundColor: theme.secondaryBackground
    },
    buyWalletButton: {
      ...spacings.mb0,
      height: 48,
      borderRadius: 16
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
    footerRow: {
      ...flexbox.directionRow,
      ...flexbox.justifyCenter
    },
    footer: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.ph,
      ...spacings.pvSm,
      columnGap: SPACING
    },
    footerButton: {
      ...spacings.mb0,
      ...spacings.phLg,
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
