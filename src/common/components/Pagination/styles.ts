import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  arrowButtonWrapper: ViewStyle
}

const getStyles = (theme: ThemeProps) => {
  return StyleSheet.create<Style>({
    arrowButtonWrapper: {
      width: 24,
      height: 24,
      borderRadius: 4,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      backgroundColor: theme.quaternaryBackground
    }
  })
}

export default getStyles
