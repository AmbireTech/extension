import { StyleSheet, ViewStyle } from 'react-native'

import { IS_MOBILE_UP_BENZIN_BREAKPOINT } from '@benzin/screens/BenzinScreen/styles'
import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  logoWrapper: ViewStyle
  network: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    logoWrapper: {
      ...flexbox.alignCenter,
      ...(IS_MOBILE_UP_BENZIN_BREAKPOINT ? spacings.mbXl : {})
    },
    network: {
      borderRadius: 100,
      ...flexbox.alignSelfCenter,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifyCenter,
      ...spacings.mbXl,
      ...spacings.pvTy,
      ...spacings.plSm,
      ...spacings.prTy,
      backgroundColor: theme.primaryBackground,
      borderWidth: 1,
      borderColor: theme.primaryBorder
    }
  })

export default getStyles
