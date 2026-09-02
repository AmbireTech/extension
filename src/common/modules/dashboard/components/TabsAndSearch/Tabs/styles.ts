import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'
import { hexToRgba } from '@common/styles/utils/common'

interface Style {
  container: ViewStyle
  pendingBadge: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    pendingBadge: {
      // 6 because of the border of the badge
      marginLeft: 6,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: hexToRgba(theme.primaryAccent, 0.4),
      backgroundColor: theme.primaryAccent100
    }
  })

export default getStyles
