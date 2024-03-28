import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  iconWrapper: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...spacings.phTy,
      ...spacings.pvTy,
      ...spacings.mbTy,
      ...common.borderRadiusPrimary,
      backgroundColor: theme.primaryBackground,
      borderWidth: 1
    },
    iconWrapper: {
      width: 40,
      height: 40,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.mrTy
    }
  })

export default getStyles
