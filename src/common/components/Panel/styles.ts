import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  onboardingContainer: ViewStyle
  innerContainer: ViewStyle
  progress: ViewStyle
  backBtnWrapper: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) => {
  return StyleSheet.create<Style>({
    container: {
      ...common.borderRadiusPrimary,
      borderWidth: themeType === THEME_TYPES.DARK ? 0 : 1,
      borderColor: theme.secondaryBorder,
      backgroundColor: theme.primaryBackground
    },
    // Overridden when type === 'onboarding'
    onboardingContainer: {
      ...common.borderRadiusSecondary,
      backgroundColor: theme.primaryBackground,
      ...(themeType === THEME_TYPES.DARK ? common.shadowTertiaryDarkMode : common.shadowTertiary),
      ...flexbox.alignSelfCenter,
      minHeight: 486,
      overflow: 'hidden',
      ...spacings.mbMd
    },
    innerContainer: {
      ...flexbox.alignSelfCenter,
      ...flexbox.flex1
    },
    progress: {
      ...flexbox.flex1,
      height: 4
    },
    backBtnWrapper: {
      ...flexbox.alignCenter,
      ...flexbox.center,
      ...flexbox.directionRow,
      ...common.borderRadiusPrimary,
      width: 28,
      height: 28
    }
  })
}

export default getStyles
