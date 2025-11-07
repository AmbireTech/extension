import { StyleSheet, ViewStyle } from 'react-native'

import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  switchTokensButtonWrapper: ViewStyle
  switchTokensButton: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    switchTokensButtonWrapper: {
      position: 'absolute',
      bottom: 14,
      left: '50%',
      transform: [{ translateX: -16 }],
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...flexbox.alignSelfCenter,
      zIndex: 10
    },
    switchTokensButton: {
      borderRadius: 16,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      width: 32,
      height: 32,
      backgroundColor:
        themeType === THEME_TYPES.DARK ? `${String(theme.successDecorative)}20` : '#6000FF14'
    }
  })

export default getStyles
