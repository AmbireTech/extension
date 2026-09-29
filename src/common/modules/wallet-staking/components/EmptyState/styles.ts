import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  emptyState: ViewStyle
  emptyIcon: ViewStyle
  emptyText: TextStyle
  buyWalletWrapper: ViewStyle
  buyWalletButton: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    emptyState: {
      ...flexbox.alignCenter,
      ...spacings.phMd
    },
    emptyIcon: {
      ...flexbox.center,
      ...spacings.mbLg,
      width: 78,
      height: 78,
      borderRadius: 44,
      backgroundColor: theme.infoBackground
    },
    emptyText: {
      ...spacings.mbXl,
      maxWidth: 480,
      lineHeight: 28,
      textAlign: 'center'
    },
    buyWalletWrapper: {
      ...spacings.phSm,
      ...spacings.pvSm,
      width: 170,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.primaryBorder,
      backgroundColor: theme.secondaryBackground
    },
    buyWalletButton: {
      ...spacings.mb0,
      height: 48,
      borderRadius: 16
    }
  })

export default getStyles
