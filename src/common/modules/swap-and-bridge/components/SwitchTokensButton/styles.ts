import { StyleSheet, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
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
      top: isMobile ? -23 : -24,
      left: '50%',
      transform: [{ translateX: isMobile ? 0 : -16 }],
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...flexbox.alignSelfCenter,
      zIndex: 10,
      width: isMobile ? 34 : 38,
      height: isMobile ? 34 : 38,
      borderRadius: 50,
      backgroundColor: theme.primaryBackground
    },
    switchTokensButton: {
      borderRadius: 50,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      width: isMobile ? 28 : 32,
      height: isMobile ? 28 : 32,
      backgroundColor: hexToRgba(theme.primaryAccent200, 0.12)
    }
  })

export default getStyles
