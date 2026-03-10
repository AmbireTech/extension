import { ImageStyle, StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

interface Style {
  container: ViewStyle
  checkIcon: ViewStyle
  pfpSelectorItem: ImageStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      backgroundColor: theme.secondaryBackground,
      ...common.borderRadiusPrimary,
      ...spacings.phTy,
      ...spacings.pvSm,
      ...spacings.mbTy,
      width: '100%'
    },
    pfpSelectorItem: {
      height: 48,
      width: 48,
      borderRadius: BORDER_RADIUS_PRIMARY
    },
    checkIcon: {
      position: 'absolute',
      right: 0,
      bottom: 0
    }
  })

export default getStyles
