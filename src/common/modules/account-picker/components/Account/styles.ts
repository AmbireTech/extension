import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  deployedOnContainer: ViewStyle
  networkIcon: ViewStyle
  label: TextStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.directionRow,
      ...spacings.pvTy,
      ...flexbox.flex1,
      ...spacings.phSm,
      ...spacings.pvSm,
      width: '100%',
      height: 48
    },
    deployedOnContainer: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.phSm,
      ...spacings.pbSm,
      width: '100%',
      backgroundColor: theme.secondaryBackground
    },
    networkIcon: {
      borderRadius: 50,
      backgroundColor: theme.primaryBackground,
      borderColor: theme.secondaryBorder,
      borderWidth: 1
    },
    label: {
      fontSize: 12,
      textTransform: 'none'
    }
  })

export default getStyles
