import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Style {
  itemContainer: ViewStyle
  disabledItem: ViewStyle
  otherItemLoading: ViewStyle
  selectedItem: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    itemContainer: {
      backgroundColor: theme.secondaryBackground,
      ...common.borderRadiusPrimary,
      ...spacings.pbSm,
      ...spacings.pt,
      ...spacings.phSm,
      ...spacings.mbTy,
      borderWidth: 1,
      borderColor: 'transparent'
    },
    disabledItem: {
      opacity: 0.5
    },
    otherItemLoading: {
      opacity: 0.7
    },
    selectedItem: {
      borderColor: theme.successDecorative
    }
  })

export default getStyles
