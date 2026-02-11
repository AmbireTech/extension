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
      ...spacings.phMd,
      ...spacings.pvMd,
      ...common.borderRadiusPrimary,
      borderWidth: 1,
      backgroundColor: theme.tertiaryBackground
    }
  })

export default getStyles
