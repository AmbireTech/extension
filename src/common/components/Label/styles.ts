import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  warningText: TextStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...common.borderRadiusSecondary
    },
    warningText: {
      color: theme.warningText
    }
  })

export default getStyles
