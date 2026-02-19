import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  alertText: ViewStyle
  footer: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    alertText: {
      ...flexbox.flex1,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.wrap,
      maxWidth: '100%'
    },
    footer: {
      ...spacings.mv,
      ...spacings.mh
    }
  })

export default getStyles
