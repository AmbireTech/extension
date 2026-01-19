import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import commonWebStyles from '@web/styles/utils/common'

interface Style {
  contentContainer: ViewStyle
  overview: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    overview: {
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween
    },
    contentContainer: {
      ...commonWebStyles.contentContainer,
      ...common.borderRadiusSecondary,
      backgroundColor: theme.primaryBackground,
      ...(themeType === THEME_TYPES.DARK ? common.shadowTertiaryDarkMode : common.shadowTertiary),
      ...flexbox.flex1,
      ...spacings.mb2Xl,
      ...spacings.pvLg,
      ...spacings.phLg,
      ...spacings.ptSm
    }
  })

export default getStyles
