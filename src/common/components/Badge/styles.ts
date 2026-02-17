import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  badge: ViewStyle
  newBadge: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    badge: {
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.phTy,
      borderRadius: 50
    },
    container: {
      ...flexbox.directionRow
    },
    newBadge: {
      borderColor: theme.infoDecorative,
      // @ts-ignore
      backgroundImage: 'linear-gradient(90deg, #6000FF 0%, #FFA000 100%)'
    }
  })

export default getStyles
