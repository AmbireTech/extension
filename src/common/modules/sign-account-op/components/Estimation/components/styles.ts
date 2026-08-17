import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  gasTankIconContainer: ViewStyle
  // Note: Under discussion
  // walletBalanceBadge: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    gasTankIconContainer: {
      width: 32,
      height: 32,
      borderRadius: 30,
      backgroundColor: theme.neutral200,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter
    }
    // Note: Under discussion
    // walletBalanceBadge: {
    //   borderRadius: 50,
    //   backgroundColor: theme.infoBackground,
    //   borderColor: theme.infoBackground,
    //   borderWidth: 1,
    //   ...spacings.phMi,
    //   ...spacings.mlMi
    // }
  })

export default getStyles
