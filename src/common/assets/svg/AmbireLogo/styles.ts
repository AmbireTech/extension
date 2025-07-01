import { StyleSheet, ViewStyle } from 'react-native'

import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  wrapper: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) => {
  return StyleSheet.create<Style>({
    wrapper: {
      width: 96,
      height: 96,
      borderRadius: 16,
      backgroundColor:
        themeType === THEME_TYPES.DARK ? theme.quaternaryBackground : theme.secondaryBackground,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter
    }
  })
}

export default getStyles
