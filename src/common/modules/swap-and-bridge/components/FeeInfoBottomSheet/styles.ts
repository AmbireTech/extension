import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import common, { hexToRgba } from '@common/styles/utils/common'

interface Styles {
  centeredText: TextStyle
  table: ViewStyle
  tierRow: ViewStyle
  currentTierRow: ViewStyle
  feeExemption: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    centeredText: {
      textAlign: 'center'
    },
    table: {
      ...common.borderRadiusSecondary,
      borderWidth: 1,
      borderColor: theme.primaryBorder,
      overflow: 'hidden'
    },
    tierRow: {
      borderTopWidth: 1,
      borderTopColor: theme.primaryBorder
    },
    currentTierRow: {
      backgroundColor: hexToRgba(theme.primaryAccent, 0.12)
    },
    feeExemption: {
      ...common.borderRadiusSecondary,
      backgroundColor: theme.successBackground,
      borderColor: theme.successDecorative,
      borderWidth: 1
    }
  })

export default getStyles
