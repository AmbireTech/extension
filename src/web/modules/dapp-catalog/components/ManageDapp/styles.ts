import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  networkSelectorContainer: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    networkSelectorContainer: {
      ...spacings.phSm,
      ...spacings.pvSm,
      backgroundColor: themeType === THEME_TYPES.DARK ? 'transparent' : theme.infoBackground,
      borderWidth: 1,
      ...common.borderRadiusPrimary,
      borderColor: themeType === THEME_TYPES.DARK ? theme.linkText : theme.primary,
      ...flexbox.directionRow,
      ...spacings.mbLg
    }
  })

export default getStyles
