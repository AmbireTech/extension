import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Style {
  currentEmailContainer: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    currentEmailContainer: {
      ...spacings.pvSm,
      ...spacings.phSm,
      ...common.borderRadiusPrimary,
      backgroundColor: theme.secondaryBackground
    }
  })

export default getStyles
