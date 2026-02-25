import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

type Style = {
  containerInnerWrapper: ViewStyle
  content: ViewStyle
  descriptionTextWrapper: ViewStyle
  buttonWrapper: ViewStyle
  overlay: ViewStyle
  iconWrapper: ViewStyle
  bulletWrapper: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    containerInnerWrapper: {
      ...common.shadowSecondary,
      maxHeight: 600
    },
    content: {
      ...common.borderRadiusPrimary,
      width: '100%'
    },
    descriptionTextWrapper: {
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...flexbox.alignCenter,
      backgroundColor: theme.primaryBackground,
      borderWidth: 1,
      ...common.borderRadiusPrimary,
      ...spacings.pv,
      ...spacings.ph,
      ...spacings.mbXl
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'white',
      opacity: 0.5,
      zIndex: 1
    },
    buttonWrapper: { ...flexbox.directionRow, ...flexbox.alignSelfEnd },
    iconWrapper: {
      ...flexbox.directionRow,
      ...flexbox.justifyCenter,
      ...flexbox.alignCenter
    },
    bulletWrapper: {
      maxWidth: 422,
      ...spacings.pvSm,
      ...spacings.phSm,
      ...spacings.mtMd,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...common.borderRadiusPrimary,
      ...common.shadowPrimary,
      backgroundColor: theme.primaryBackground
    }
  })

export default getStyles
