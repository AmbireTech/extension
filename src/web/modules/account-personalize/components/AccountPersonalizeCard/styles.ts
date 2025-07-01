import { ImageStyle, StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Style {
  container: ViewStyle
  checkIcon: ViewStyle
  pfpSelectorItem: ImageStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    container: {
      backgroundColor:
        themeType === THEME_TYPES.DARK ? theme.secondaryBackground : theme.primaryBackground,
      borderColor: theme.secondaryBorder,
      borderWidth: themeType === THEME_TYPES.DARK ? 0 : 1,
      ...common.borderRadiusPrimary,
      ...spacings.phTy,
      ...spacings.pvTy,
      ...spacings.mbSm,
      width: '100%',
      flex: 1
    },
    pfpSelectorItem: {
      height: 48,
      width: 48,
      ...common.borderRadiusPrimary
    },
    checkIcon: {
      position: 'absolute',
      right: 0,
      bottom: 0
    }
  })

export default getStyles
