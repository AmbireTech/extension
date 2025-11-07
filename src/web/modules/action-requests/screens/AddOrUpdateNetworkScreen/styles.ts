import { StyleSheet, ViewStyle } from 'react-native'

import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  dappInfoContainer: ViewStyle
  dappInfoContent: ViewStyle
  separator: ViewStyle
  boxWrapper: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    dappInfoContainer: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    dappInfoContent: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.flex1
    },
    separator: {
      width: 1,
      maxWidth: 1,
      flex: 1,
      marginHorizontal: 10
    },
    boxWrapper: {
      borderRadius: BORDER_RADIUS_PRIMARY,
      overflow: 'hidden',
      ...common.borderRadiusPrimary,
      ...(themeType === THEME_TYPES.DARK ? common.shadowTertiaryDarkMode : common.shadowTertiary),
      backgroundColor:
        themeType === THEME_TYPES.DARK ? theme.secondaryBackground : theme.primaryBackground,
      minHeight: 200
    }
  })

export default getStyles
