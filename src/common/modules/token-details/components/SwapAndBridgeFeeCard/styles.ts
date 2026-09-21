import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

interface Styles {
  card: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    card: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: BORDER_RADIUS_PRIMARY
    }
  })

export default getStyles
