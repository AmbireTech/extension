import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

interface Styles {
  card: ViewStyle
  actions: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    card: {
      borderWidth: 1,
      borderColor: theme.warningText,
      borderRadius: BORDER_RADIUS_PRIMARY,
      backgroundColor: theme.warningBackground
    },
    actions: {
      alignSelf: 'flex-end'
    }
  })

export default getStyles
