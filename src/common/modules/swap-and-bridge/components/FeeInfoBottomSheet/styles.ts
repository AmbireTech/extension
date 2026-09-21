import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Styles {
  centeredText: TextStyle
  rightAlignedText: TextStyle
  tierCard: ViewStyle
  currentTierCard: ViewStyle
  maximumTierCard: ViewStyle
  currentMaximumTierCard: ViewStyle
  tierDetails: ViewStyle
  currentTierBadge: ViewStyle
  currentTierBadgeText: TextStyle
  cancelButton: ViewStyle
  stakeButton: ViewStyle
  actionButtonText: TextStyle
  feeExemption: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    centeredText: {
      textAlign: 'center'
    },
    rightAlignedText: {
      textAlign: 'right'
    },
    tierCard: {
      ...common.borderRadiusSecondary,
      backgroundColor: theme.secondaryBackground
    },
    currentTierCard: {
      backgroundColor: theme.secondaryBackground,
      borderColor: theme.neutral600,
      borderWidth: 1
    },
    maximumTierCard: {
      backgroundColor: theme.successBackground
    },
    currentMaximumTierCard: {
      borderColor: theme.successText,
      borderWidth: 1
    },
    tierDetails: {
      minWidth: 0
    },
    currentTierBadge: {
      backgroundColor: theme.neutral800
    },
    currentTierBadgeText: {
      color: theme.primaryBackground,
      fontSize: 11
    },
    cancelButton: {
      width: 'auto',
      paddingLeft: 16,
      paddingRight: 16,
      height: 52
    },
    stakeButton: {
      width: 'auto',
      marginLeft: 24,
      paddingLeft: 24,
      paddingRight: 24,
      height: 52
    },
    actionButtonText: {
      fontSize: 16
    },
    feeExemption: {
      ...common.borderRadiusSecondary,
      backgroundColor: theme.successBackground,
      borderColor: theme.successDecorative,
      borderWidth: 1
    }
  })

export default getStyles
