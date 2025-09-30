import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  tokenButtonIconWrapper: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      display: 'flex',
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...spacings.pvTy,
      ...spacings.phTy
      // ...common.borderRadiusPrimary
    },
    // TODO: remove this as well as the wrapper in TokenItem
    tokenButtonIconWrapper: {
      backgroundColor: theme.secondaryBackground,
      ...common.borderRadiusPrimary,
      ...flexbox.center,
      width: 40,
      height: 40
    }
  })

export default getStyles
