import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { isMobile } from '@common/config/env'
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
  actions: ViewStyle
  primaryAction: ViewStyle
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
    },
    actions: {
      ...(isMobile ? {} : flexbox.directionRow),
      ...spacings.mtSm
    },
    primaryAction: {
      ...(isMobile ? spacings.mbTy : spacings.mrTy)
    }
  })

export default getStyles
