import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  container: ViewStyle
  content: ViewStyle
  header: ViewStyle
  iconContainer: ViewStyle
  title: TextStyle
  badge: ViewStyle
  trustButton: ViewStyle
  secondaryContainer: ViewStyle
  secondaryText: TextStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    container: {
      ...flexbox.directionRow,
      ...flexbox.alignStart,
      ...spacings.ph,
      ...spacings.pvSm,
      overflow: 'hidden',
      borderWidth: 1,
      borderLeftWidth: 4,
      borderRadius: 8,
      borderColor: theme.primaryBorder,
      backgroundColor: theme.primaryBackground
    },
    content: {
      ...flexbox.flex1
    },
    header: {
      ...flexbox.directionRow,
      ...flexbox.alignStart,
      ...flexbox.justifySpaceBetween,
      ...spacings.mbTy
    },
    iconContainer: {
      ...flexbox.center,
      ...spacings.mr,
      width: 40,
      height: 40,
      borderRadius: 20,
      flexShrink: 0
    },
    title: {
      ...flexbox.flex1,
      ...spacings.mrSm
    },
    badge: {
      flexShrink: 0
    },
    // Cancels the fixed height that Button's `size` applies, so the button is only as tall as its
    // own label, and keeps it from stretching to the row when the heading wraps to two lines.
    trustButton: {
      alignSelf: 'flex-start',
      height: 'auto',
      minHeight: 'auto'
    },
    secondaryContainer: {
      ...flexbox.directionRow,
      ...flexbox.alignStart,
      ...spacings.mtSm,
      ...spacings.phSm,
      ...spacings.pvTy,
      borderRadius: 8
    },
    secondaryText: {
      ...flexbox.flex1,
      ...spacings.mlTy
    }
  })

export default getStyles
