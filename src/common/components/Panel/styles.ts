import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Style {
  container: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...spacings.ph3Xl,
      ...spacings.pvXl,
      ...common.borderRadiusPrimary,
      borderWidth: 1,
      borderColor: theme.secondaryBorder,
      backgroundColor: theme.primaryBackground
    }
  })

export default getStyles
