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
  tierBadge: ViewStyle
  tierBadgeText: TextStyle
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
      backgroundColor: theme.primaryAccent100
    },
    maximumTierCard: {
      backgroundColor: theme.successBackground
    },
    tierDetails: {
      minWidth: 0
    },
    feeDetails: {
      flexShrink: 0
    },
    tierBadge: {
      backgroundColor: theme.primaryAccent200
    },
    tierBadgeText: {
      color: '#fff'
    },
    feeExemption: {
      ...common.borderRadiusSecondary,
      backgroundColor: theme.successBackground,
      borderColor: theme.successDecorative,
      borderWidth: 1
    }
  })

export default getStyles
