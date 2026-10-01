import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

interface Style {
  compactFooterContainer: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    // Mirrors the mobile SignAccountOpScreen footer (the iOS variant - a top-only accent line), but on
    // secondaryBackground so the web selects and secondary buttons (primaryBackground) stay visible
    compactFooterContainer: {
      borderTopStartRadius: BORDER_RADIUS_PRIMARY,
      borderTopEndRadius: BORDER_RADIUS_PRIMARY,
      shadowOffset: { width: 0, height: -2 },
      shadowColor: theme.primaryAccent400,
      shadowOpacity: 1,
      shadowRadius: 0,
      backgroundColor: theme.secondaryBackground,
      ...spacings.phSm,
      ...spacings.pbSm
    }
  })

export default getStyles
