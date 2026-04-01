import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps, ThemeType } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  gasTankIconWrapper: ViewStyle
  gasTankBadge: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    gasTankIconWrapper: {
      backgroundColor: theme.neutral200,
      borderRadius: 50,
      width: 32,
      height: 32,
      ...flexbox.center
    },
    gasTankBadge: {
      borderRadius: 50,
      backgroundColor: theme.primaryAccent,
      borderColor: theme.primaryAccent,
      borderWidth: 1,
      ...spacings.phMi,
      ...spacings.mlMi
    }
  })

export default getStyles
