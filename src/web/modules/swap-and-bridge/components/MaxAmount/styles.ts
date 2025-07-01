import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Style {
  maxButton: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    maxButton: {
      backgroundColor:
        themeType === THEME_TYPES.DARK ? `${theme.primary as string}14` : '#6000FF14',
      ...common.borderRadiusPrimary,
      paddingVertical: 2,
      ...spacings.phSm,
      borderRadius: 11,
      ...spacings.mlTy
    }
  })

export default getStyles
