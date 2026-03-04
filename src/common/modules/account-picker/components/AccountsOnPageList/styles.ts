import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'

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
      borderRadius: 28,
      ...spacings.ptMd,
      ...spacings.phSm,
      ...spacings.pbSm,
      borderWidth: 1,
      borderColor: theme.primaryAccent
    }
  })

export default getStyles
