import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import common, { hexToRgba } from '@common/styles/utils/common'

interface Styles {
  feeButton: ViewStyle
  feeButtonSuccess: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    feeButton: {
      ...common.borderRadiusPrimary,
      backgroundColor: hexToRgba(theme.primaryAccent, 0.1),
      borderColor: hexToRgba(theme.primaryAccent, 0.35),
      borderWidth: 1
    },
    feeButtonSuccess: {
      backgroundColor: theme.successBackground,
      borderColor: theme.successDecorative
    }
  })

export default getStyles
