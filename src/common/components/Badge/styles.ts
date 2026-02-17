import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  badge: ViewStyle
  newBadge: ViewStyle
  outlineBadge: ViewStyle
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
      ...spacings.plTy,
      ...spacings.prMi,
      borderRadius: 64,
      backgroundColor: theme.success400,
      borderWidth: 1,
      borderColor: theme.neutral400
    },
    outlineBadge: {
      borderWidth: 1,
      borderColor: theme.neutral500
    }
  })

export default getStyles
