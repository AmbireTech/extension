import { StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Style {
  container: ViewStyle
  closeIcon: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      backgroundColor: theme.secondaryBackground,
      ...common.borderRadiusPrimary,
      ...spacings.phSm,
      ...spacings.pt,
      ...spacings.pbSm
    },
    closeIcon: {
      position: 'absolute',
      right: SPACING,
      top: SPACING
    }
  })

export default getStyles
