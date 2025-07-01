import { StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_MI } from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

interface Style {
  container: ViewStyle
  element: ViewStyle
  activeElement: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    container: {
      ...spacings.mrSm,
      ...flexbox.directionRow,
      paddingHorizontal: SPACING_MI / 2,
      paddingVertical: SPACING_MI / 2,
      borderRadius: BORDER_RADIUS_PRIMARY,
      backgroundColor:
        themeType === THEME_TYPES.DARK ? theme.secondaryBackground : theme.tertiaryBackground
    },
    element: {
      ...spacings.pvMi,
      ...spacings.phTy,
      ...text.center,
      fontSize: 14,
      color: theme.secondaryText,
      width: 72,
      borderRadius: BORDER_RADIUS_PRIMARY
    },
    activeElement: {
      backgroundColor: theme.primaryBackground,
      color: themeType === THEME_TYPES.DARK ? theme.primary : theme.primaryText,
      shadowColor: theme.tertiaryText,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 4,
      shadowOpacity: themeType === THEME_TYPES.DARK ? 0 : 0.25
    }
  })

export default getStyles
