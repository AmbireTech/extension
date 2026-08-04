import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps, ThemeType } from '@common/styles/themeConfig'

interface Style {
  gasTankBadge: ViewStyle
  walletBalanceBadge: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    gasTankBadge: {
      borderRadius: 50,
      backgroundColor: theme.primaryAccent,
      borderColor: theme.primaryAccent,
      borderWidth: 1,
      ...spacings.phMi,
      ...spacings.mlMi
    },
    walletBalanceBadge: {
      borderRadius: 50,
      backgroundColor: theme.infoBackground,
      ...spacings.phMi,
      ...spacings.mlMi
    }
  })

export default getStyles
