import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  radioOuter: ViewStyle
  radioOuterActive: ViewStyle
  radioInner: ViewStyle
  radioInnerActive: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 50,
      borderWidth: 2,
      borderColor: theme.neutral100,
      ...flexbox.center,
      ...spacings.mrSm
    },
    radioOuterActive: {
      borderColor: theme.successDecorative
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 50,
      backgroundColor: 'transparent'
    },
    radioInnerActive: {
      backgroundColor: theme.successDecorative
    }
  })

export default getStyles
