import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Style {
  container: ViewStyle
  pressable: ViewStyle
  hoverOverlay: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      backgroundColor: theme.secondaryBackground,
      ...common.borderRadiusPrimary
    },
    pressable: {
      ...common.borderRadiusPrimary,
      overflow: 'hidden'
    },
    hoverOverlay: {
      ...StyleSheet.absoluteFillObject,
      ...common.borderRadiusPrimary
    }
  })

export default getStyles
