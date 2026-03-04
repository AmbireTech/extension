import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps, ThemeType } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  wrapper: ViewStyle
}

const getStyles = (theme: ThemeProps) => {
  return StyleSheet.create<Style>({
    wrapper: {
      width: 96,
      height: 96,
      borderRadius: 16,
      backgroundColor: theme.secondaryBackground,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter
    }
  })
}

export default getStyles
