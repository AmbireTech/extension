import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  contentContainer: ViewStyle
  informationCircle: ViewStyle
  footerContainer: ViewStyle
  footer: ViewStyle
  progressContainer: ViewStyle
  progress: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    contentContainer: {
      // ...spacings.phSm,
      ...spacings.pbSm,
      ...flexbox.flex1
    },
    informationCircle: {
      ...flexbox.alignSelfCenter,
      ...spacings.pbLg
    },
    footerContainer: {
      ...flexbox.flex1,
      maxHeight: 80,
      ...spacings.phMd,
      backgroundColor: theme.secondaryBackground,
      shadowColor: themeType === THEME_TYPES.DARK ? '#00000052' : '#B8BDE080',
      shadowOffset: { width: 0, height: -2 },
      shadowRadius: 4,
      elevation: 7
    },
    progressContainer: {
      ...flexbox.directionRow,
      ...flexbox.justifyCenter,
      ...spacings.pv
    },
    progress: {
      width: 64,
      height: 4,
      ...common.borderRadiusPrimary,
      ...spacings.mhMi
    },
    footer: {
      ...flexbox.flex1,
      ...flexbox.justifySpaceBetween,
      ...flexbox.alignCenter,
      ...flexbox.directionRow,
      width: '100%',
      marginHorizontal: 'auto'
    }
  })

export default getStyles
