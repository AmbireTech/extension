import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Styles {
  centeredText: TextStyle
  tierCard: ViewStyle
  currentTierCard: ViewStyle
  maximumTierCard: ViewStyle
  tierDetails: ViewStyle
  feeDetails: ViewStyle
  currentTierBadge: ViewStyle
  maximumTierBadge: ViewStyle
  featuredTierBadgeText: TextStyle
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
    tierCard: {
      ...common.borderRadiusSecondary,
      backgroundColor: theme.secondaryBackground
    },
    currentTierCard: {
      backgroundColor: theme.primaryAccent100,
      borderColor: theme.primaryAccent,
      borderWidth: 1
    },
    maximumTierCard: {
      backgroundColor: theme.successBackground,
      borderColor: theme.successText,
      borderWidth: 1
    },
    tierDetails: {
      minWidth: 0
    },
    feeDetails: {
      flexShrink: 0
    },
    currentTierBadge: {
      backgroundColor: theme.primaryAccent200
    },
    maximumTierBadge: {
      backgroundColor: theme.success200
    },
    featuredTierBadgeText: {
      color: theme.primaryAccent500,
      fontSize: 11
    },
    cancelButton: {
      width: 'auto',
      paddingLeft: 16,
      paddingRight: 16
    },
    stakeButton: {
      width: 'auto',
      marginLeft: 24,
      paddingLeft: 24,
      paddingRight: 24
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
