import type { ViewStyle } from 'react-native'
import { StyleSheet } from 'react-native'

import { hexToRgba } from '@common/styles/utils/common'

import type { ThemeProps } from '@common/styles/themeConfig'

interface Styles {
  item: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    item: {
      minHeight: 28,
      borderRadius: 8,
      backgroundColor: hexToRgba(theme.primaryBackground, 0.75)
    }
  })

export default getStyles
