import { StyleSheet, ViewStyle } from 'react-native'

import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  withContainerStyle: ViewStyle
  networkIconWrapper: ViewStyle
  networkIcon: ViewStyle
  loader: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    withContainerStyle: {
      backgroundColor: theme.secondaryBackground,
      ...common.borderRadiusPrimary,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter
    },
    networkIconWrapper: {
      position: 'absolute',
      left: 0,
      top: 0,
      zIndex: 3,
      borderWidth: 1,
      borderColor:
        themeType === THEME_TYPES.DARK ? theme.secondaryBackground : theme.secondaryBorder,
      borderRadius: 12
    },
    networkIcon: {
      backgroundColor:
        themeType === THEME_TYPES.DARK ? theme.primaryBackgroundInverted : theme.primaryBackground
    },
    loader: { position: 'absolute', zIndex: 2 }
  })

export default getStyles
