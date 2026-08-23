import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING } from '@common/styles/spacings'
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
  stakingFormContainer: ViewStyle
  pendingWithdrawalCard: ViewStyle
  pendingWithdrawalIcon: ViewStyle
  pendingWithdrawalText: TextStyle
  pendingWithdrawalDescription: TextStyle
  disabledStakingForm: ViewStyle
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
  amountSlider: ViewStyle
  amountSliderTrack: ViewStyle
  amountSliderProgress: ViewStyle
  amountSliderThumb: ViewStyle
  amountSliderLabels: ViewStyle
  feePreviewRow: ViewStyle
  details: ViewStyle
  detailRow: ViewStyle
  footerRow: ViewStyle
  footer: ViewStyle
  footerButton: ViewStyle
  validation: TextStyle
}

const SLIDER_THUMB_SIZE = 20

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
    stakingFormContainer: {
      position: 'relative'
    },
    pendingWithdrawalCard: {
      ...flexbox.alignCenter,
      ...spacings.phMd,
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      zIndex: 1
    },
    pendingWithdrawalIcon: {
      ...flexbox.center,
      ...spacings.mbSm
    },
    pendingWithdrawalText: {
      ...spacings.mbTy,
      textAlign: 'center'
    },
    pendingWithdrawalDescription: {
      ...spacings.mtMd,
      maxWidth: 460,
      lineHeight: 20,
      textAlign: 'center'
    },
    disabledStakingForm: {
      opacity: 0.18
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
    amountSlider: {
      ...flexbox.justifyCenter,
      height: 28,
      position: 'relative'
    },
    amountSliderTrack: {
      position: 'absolute',
      top: 12,
      right: SLIDER_THUMB_SIZE / 2,
      left: SLIDER_THUMB_SIZE / 2,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.tertiaryText
    },
    amountSliderProgress: {
      position: 'absolute',
      top: 12,
      left: SLIDER_THUMB_SIZE / 2,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.primaryAccent300
    },
    amountSliderThumb: {
      position: 'absolute',
      top: 4,
      width: SLIDER_THUMB_SIZE,
      height: SLIDER_THUMB_SIZE,
      borderRadius: SLIDER_THUMB_SIZE / 2,
      borderWidth: 3,
      borderColor: theme.primaryAccent200,
      backgroundColor: theme.primaryAccent300
    },
    amountSliderLabels: {
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...spacings.phTy
    },
    feePreviewRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.mtSm,
      ...spacings.phSm,
      ...spacings.ptSm,
      ...spacings.pbSm,
      borderRadius: 12,
      backgroundColor: theme.tertiaryBackground
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
