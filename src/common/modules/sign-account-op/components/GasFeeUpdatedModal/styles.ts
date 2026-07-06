import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  arrowColumn: ViewStyle
  gasTankIconWrapper: ViewStyle
  tokenIconContainer: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    arrowColumn: {
      width: 60
    },
    gasTankIconWrapper: {
      backgroundColor: theme.neutral200,
      borderRadius: 50,
      width: 32,
      height: 32,
      ...flexbox.center
    },
    tokenIconContainer: {
      width: 32,
      height: 32
    }
  })

export default getStyles
