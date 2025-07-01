import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'

interface Style {
  itemContainer: ViewStyle
  disabledItem: ViewStyle
  otherItemLoading: ViewStyle
  selectedItem: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    itemContainer: {
      backgroundColor: theme.primaryBackground,
      ...common.borderRadiusPrimary,
      ...spacings.pv,
      ...spacings.ph,
      ...spacings.mbSm,
      borderWidth: 1,
      borderColor: theme.primaryBackground
    },
    disabledItem: {
      opacity: 0.5
    },
    otherItemLoading: {
      opacity: 0.7
    },
    selectedItem: {
      borderColor: themeType === THEME_TYPES.DARK ? theme.linkText : theme.primary
    }
  })

export default getStyles
