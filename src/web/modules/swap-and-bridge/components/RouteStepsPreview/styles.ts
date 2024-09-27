import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  tokenContainer: ViewStyle
  tokenWrapper: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    tokenContainer: {
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.phMi,
      minWidth: 50
    },
    tokenWrapper: {
      ...spacings.pbMi
    }
  })

export default getStyles
