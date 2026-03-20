import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY, hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  footerContainer: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    footerContainer: {
      borderTopStartRadius: BORDER_RADIUS_PRIMARY,
      borderTopEndRadius: BORDER_RADIUS_PRIMARY,
      shadowOffset: { width: 0, height: -2 },
      shadowColor: theme.primaryAccent400,
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 8,
      backgroundColor: theme.primaryBackground,
      ...spacings.phSm,
      ...spacings.pbSm
    }
  })

export default getStyles
