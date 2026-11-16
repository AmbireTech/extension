import { StyleSheet, ViewStyle } from 'react-native'

import getFeeFooterContainerStyle from '@common/modules/sign-account-op/components/Footer/getFeeFooterContainerStyle'
import { ThemeProps } from '@common/styles/themeConfig'

interface Style {
  footerContainer: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    footerContainer: getFeeFooterContainerStyle(theme)
  })

export default getStyles
