import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'

interface Style {
  checkIconOuterWrapper: ViewStyle
  checkIconInnerWrapper: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    checkIconOuterWrapper: {
      width: 64,
      height: 64,
      backgroundColor: `${String(theme.successDecorative)}26`,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      ...spacings.mb
    },
    checkIconInnerWrapper: {
      width: 48,
      height: 48,
      backgroundColor: theme.successDecorative,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center'
    }
  })

export default getStyles
