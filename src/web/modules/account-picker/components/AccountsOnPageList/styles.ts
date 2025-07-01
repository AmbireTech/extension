import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Style {
  spinner: ViewStyle
  smartAccountWrapper: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    spinner: {
      width: 28,
      height: 28,
      // Prevents the spinner from overflowing the container, causing an annoying vertical scrollbar
      overflow: 'hidden'
    },
    smartAccountWrapper: {
      ...common.borderRadiusPrimary,
      ...spacings.ph,
      ...spacings.pv,
      borderColor: `${String(theme.primary)}14`
    }
  })

export default getStyles
