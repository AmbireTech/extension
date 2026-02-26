import { StyleSheet, ViewStyle } from 'react-native'

import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  switchTokensButtonWrapper: ViewStyle
  switchTokensButton: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    switchTokensButtonWrapper: {
      position: 'absolute',
      top: -24,
      left: '50%',
      transform: [{ translateX: -16 }],
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...flexbox.alignSelfCenter,
      zIndex: 10,
      width: 38,
      height: 38,
      borderRadius: 20,
      backgroundColor: theme.primaryBackground
    },
    switchTokensButton: {
      borderRadius: 16,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      width: 32,
      height: 32,
      backgroundColor: hexToRgba(theme.primaryAccent200, 0.12)
    }
  })

export default getStyles
