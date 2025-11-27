import { ImageStyle, StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_SM } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  border: ViewStyle
  currentDApp: ViewStyle
  icon: ImageStyle
  titleWrapper: ViewStyle
  fallbackWrapper: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    fallbackWrapper: {
      width: 30,
      height: 30,
      // @ts-ignore
      borderRadius: '50%',
      backgroundColor: theme.primaryLight80,
      alignItems: 'center',
      justifyContent: 'center'
    },
    currentDApp: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.flex1
    },
    icon: {
      width: 32,
      height: 32,
      ...common.borderRadiusPrimary
    },
    border: {
      borderWidth: 1,
      ...common.borderRadiusPrimary,
      borderColor: theme.secondaryBorder,
      ...flexbox.directionRow,
      ...spacings.phTy,
      ...spacings.pvTy,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...flexbox.flex1
    },
    titleWrapper: {
      backgroundColor: theme.secondaryBackground,
      ...spacings.phTy,
      position: 'absolute',
      top: -9,
      left: SPACING_SM,
      zIndex: 50
    }
  })

export default getStyles
