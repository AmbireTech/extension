import { StyleSheet, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
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
      ...(isWeb ? common.shadowSecondary : {}),
      maxHeight: isWeb ? 600 : 'auto'
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
      maxWidth: isWeb ? 422 : 'auto',
      ...spacings.pvSm,
      ...spacings.phSm,
      ...spacings.mtMd,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...common.borderRadiusPrimary,
      ...(isWeb ? common.shadowPrimary : {}),
      backgroundColor: theme.primaryBackground
    }
  })

export default getStyles
