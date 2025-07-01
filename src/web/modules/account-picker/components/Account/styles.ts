import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  networkIcon: ViewStyle
  label: TextStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.directionRow,
      ...spacings.pvTy,
      ...flexbox.flex1,
      ...spacings.ph,
      ...spacings.pv,
      width: '100%',
      height: 52
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
