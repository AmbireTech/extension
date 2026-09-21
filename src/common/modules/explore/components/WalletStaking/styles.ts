import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import spacings, { SPACING, SPACING_SM } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  cardWrapper: ViewStyle
  card: ViewStyle
  cardGradient: ViewStyle
  cardContent: ViewStyle
  cardHeader: ViewStyle
  cardTitleWrapper: ViewStyle
  cardDescription: TextStyle
  walletStakingIconWrapper: ViewStyle
  walletStakingIcon: ImageStyle
  screenContent: ViewStyle
  mainContent: ViewStyle
  mainContentContent: ViewStyle
  learnMore: ViewStyle
  tabs: ViewStyle
  tab: ViewStyle
  activeTab: ViewStyle
  stakingFormContainer: ViewStyle
  loadingState: ViewStyle
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
  detailsCard: ViewStyle
  balanceRow: ViewStyle
  balanceWithMax: ViewStyle
  maxButton: ViewStyle
  maxButtonDisabled: ViewStyle
  switchAmountFieldMode: ViewStyle
  switchAmountFieldModeValue: TextStyle
  switchAmountFieldModeIcon: ViewStyle
  amountInput: ViewStyle
  amountInputWrapper: ViewStyle
  amountNativeInput: TextStyle
  feePreviewRow: ViewStyle
  feePreviewLabel: ViewStyle
  feeDetailsButton: ViewStyle
  feePreviewValues: ViewStyle
  feePreviewOldFee: TextStyle
  feePreviewNewFee: TextStyle
  details: ViewStyle
  cardDetails: ViewStyle
  detailRow: ViewStyle
  footerRow: ViewStyle
  footerButtons: ViewStyle
  footerButtonsCompact: ViewStyle
  footerButtonsMobile: ViewStyle
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
    cardGradient: {
      ...StyleSheet.absoluteFillObject
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
      ...spacings.phSm,
      // On native `LayoutWrapper` already pads the bottom safe area, so padding here too
      // would lift the footer buttons higher than the Swap & Bridge ones
      ...(isWeb ? spacings.pbSm : {})
    },
    // A ScrollView (not a plain View): on a fixed-height, non-scrolling screen, content taller
    // than the space left for it used to overflow visually into footerRow below (flex children
    // don't push siblings down when they overflow their own box), overlapping the footer buttons.
    // Scrolling internally means mainContent's own box never grows past what layout gives it, so
    // footerRow (pinned to the bottom via its own `marginTop: 'auto'`) is never overlapped.
    mainContent: {
      ...flexbox.flex1
    },
    mainContentContent: {
      flexGrow: 1
    },
    learnMore: {
      ...flexbox.directionRow,
      ...flexbox.justifyCenter,
      ...flexbox.wrap,
      ...spacings.mb
    },
    tabs: {
      ...flexbox.directionRow,
      ...flexbox.justifyCenter,
      ...spacings.mb
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
    loadingState: {
      ...flexbox.flex1,
      ...flexbox.directionRow,
      ...flexbox.justifyCenter,
      columnGap: SPACING / 2,
      ...spacings.mt2Xl
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
      ...spacings.mbSm,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 16
    },
    detailsCard: {
      ...spacings.phSm,
      ...spacings.pvSm,
      ...spacings.mbLg,
      rowGap: SPACING_SM,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 16
    },
    balanceRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.mbTy,
      minHeight: 24
    },
    balanceWithMax: {
      // The balance and the Max button keep their size, so only the converted amount next to them
      // gives way when it is too long for the row
      flexShrink: 0
    },
    maxButton: {
      ...spacings.mlTy,
      ...spacings.mrMi,
      ...spacings.phSm,
      paddingVertical: 2,
      borderRadius: 11
    },
    maxButtonDisabled: {
      opacity: 0.5
    },
    switchAmountFieldMode: {
      ...flexbox.flex1,
      minWidth: 0
    },
    switchAmountFieldModeValue: {
      ...spacings.mrTy,
      flexShrink: 1
    },
    switchAmountFieldModeIcon: {
      ...flexbox.center,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.primaryAccent100
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
    feePreviewRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.phSm,
      ...spacings.ptSm,
      ...spacings.pbSm,
      borderRadius: 12,
      backgroundColor: theme.tertiaryBackground
    },
    feePreviewLabel: {
      ...flexbox.alignStart
    },
    feeDetailsButton: {
      ...spacings.mtTy,
      ...spacings.mb0,
      // The tiny button vertical padding leaves less space than the text line height,
      // which pushes the text off the vertical center
      ...spacings.pv0,
      height: 24,
      borderColor: theme.primaryAccent300
    },
    feePreviewValues: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      columnGap: SPACING / 2
    },
    feePreviewOldFee: {
      textDecorationLine: 'line-through'
    },
    feePreviewNewFee: {},
    details: {
      ...spacings.phSm
    },
    cardDetails: {
      rowGap: SPACING_SM
    },
    detailRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      columnGap: SPACING
    },
    footerRow: {
      marginTop: 'auto'
    },
    footerButtons: {
      columnGap: SPACING
    },
    // The compact flat footer stacks with `column`, which would put Cancel above Stake
    footerButtonsCompact: {
      flexDirection: 'column-reverse'
    },
    footerButtonsMobile: {
      rowGap: SPACING_SM
    },
    footerButton: {
      ...spacings.mb0,
      ...(isWeb ? spacings.phLg : {}),
      height: isWeb ? 48 : 56,
      borderRadius: 18
    },
    validation: {
      ...spacings.mtTy,
      ...spacings.mlSm,
      minHeight: 16
    }
  })

export default getStyles
