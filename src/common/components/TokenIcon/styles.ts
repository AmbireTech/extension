import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  withContainerStyle: ViewStyle
  networkIconWrapper: ViewStyle
  networkIcon: ViewStyle
  loader: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    withContainerStyle: {
      backgroundColor: theme.neutral200,
      borderRadius: 30,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter
    },
    networkIconWrapper: {
      position: 'absolute',
      left: 0,
      top: 0,
      zIndex: 3,
      borderWidth: 1,
      borderColor: theme.neutral200,
      borderRadius: 12,
      shadowColor: theme.neutral300,
      shadowOffset: { width: 2, height: 2 },
      shadowOpacity: 0.24,
      shadowRadius: 3,
      elevation: 2
    },
    networkIcon: {
      backgroundColor: theme.neutral200
    },
    loader: { position: 'absolute', zIndex: 2 }
  })

export default getStyles
