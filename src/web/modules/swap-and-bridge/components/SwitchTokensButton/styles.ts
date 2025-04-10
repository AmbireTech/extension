import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  switchTokensButtonWrapper: ViewStyle
  switchTokensButton: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    switchTokensButtonWrapper: {
      height: 6,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...flexbox.alignSelfCenter,
      zIndex: 10
    },
    switchTokensButton: {
      ...common.borderRadiusPrimary,
      borderWidth: 1,
      borderColor: theme.primary,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      width: 32,
      height: 32,
      backgroundColor: theme.primaryBackground,
      shadowOffset: { width: 0, height: 3 },
      shadowColor: '#6000FF33',
      shadowRadius: 7
    }
  })

export default getStyles
