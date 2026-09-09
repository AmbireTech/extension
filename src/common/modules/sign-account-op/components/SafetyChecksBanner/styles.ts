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
      // Centered so the title lines up with whatever sits in the slot opposite it - the severity
      // badge and the taller "Trust this app" action have different heights, and top-aligning the
      // boxes would leave each of their labels at a different offset from the title.
      ...flexbox.alignCenter,
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
