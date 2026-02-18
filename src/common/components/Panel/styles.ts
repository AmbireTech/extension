import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  onboardingContainer: ViewStyle
  innerContainer: ViewStyle
  progress: ViewStyle
  backBtnWrapper: ViewStyle
}

const getStyles = (theme: ThemeProps) => {
  return StyleSheet.create<Style>({
    container: {
      ...common.borderRadiusPrimary,
      backgroundColor: theme.primaryBackground
    },
    // Overridden when type === 'onboarding'
    onboardingContainer: {
      ...common.borderRadiusSecondary,
      backgroundColor: theme.primaryBackground,
      ...common.shadowTertiary,
      shadowColor: theme.neutral400,
      ...flexbox.alignSelfCenter,
      minHeight: 486,
      overflow: 'hidden',
      ...spacings.mbMd,
      borderWidth: 1,
      borderColor: theme.neutral100
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
