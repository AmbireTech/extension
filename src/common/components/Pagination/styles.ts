import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  arrowButtonWrapper: ViewStyle
}

const getStyles = () => {
  return StyleSheet.create<Style>({
    arrowButtonWrapper: {
      width: 24,
      height: 24,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter
    }
  })
}

export default getStyles
