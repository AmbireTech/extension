import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

type Style = {
  tokenInfoAndIcon: ViewStyle
  tokenInfo: ViewStyle
  balance: ViewStyle
}

const getStyles = (theme: ThemeProps): Style =>
  StyleSheet.create({
    tokenInfoAndIcon: {
      ...flexbox.directionRow,
      ...spacings.pvTy,
      ...spacings.plTy,
      ...spacings.prSm,
      ...spacings.mbMd,
      ...flexbox.alignCenter,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 12
    },
    tokenInfo: {
      ...spacings.mlTy,
      ...flexbox.flex1,
      ...flexbox.alignStart
    },
    balance: {
      ...flexbox.flex1,
      ...flexbox.alignSelfStart,
      ...flexbox.wrap
    }
  })

export default getStyles
