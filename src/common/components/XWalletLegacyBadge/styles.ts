import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  badge: ViewStyle
  badgeDot: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    badge: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.mlTy,
      ...spacings.phTy,
      height: 16,
      borderRadius: 10,
      backgroundColor: theme.warningBackground
    },
    badgeDot: {
      ...spacings.mrMi,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.errorText
    }
  })

export default getStyles
