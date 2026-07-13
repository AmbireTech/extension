import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'

interface Style {
  icon: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    icon: {
      position: 'absolute',
      right: 10,
      top: 11,
      zIndex: 1
    }
  })

export default getStyles
