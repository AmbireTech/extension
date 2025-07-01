import { StyleSheet, ViewStyle } from 'react-native'

import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  switchTokensButtonWrapper: ViewStyle
  switchTokensButton: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    switchTokensButtonWrapper: {
      position: 'absolute',
      bottom: 8,
      left: '50%',
      transform: [{ translateX: -16 }],
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...flexbox.alignSelfCenter,
      zIndex: 10
    },
    switchTokensButton: {
      ...common.borderRadiusPrimary,
      borderWidth: themeType === THEME_TYPES.DARK ? 0 : 1,
      borderColor: theme.primary,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      width: 32,
      height: 32,
      backgroundColor:
        themeType === THEME_TYPES.DARK ? `${theme.primary as string}14` : theme.primaryBackground,
      shadowOffset: { width: 0, height: 3 },
      shadowColor: '#6000FF33',
      shadowOpacity: themeType === THEME_TYPES.DARK ? 0 : 1,
      shadowRadius: 7
    }
  })

export default getStyles
