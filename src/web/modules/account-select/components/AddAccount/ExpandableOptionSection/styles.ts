import { StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_TY } from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  optionsContainer: ViewStyle
  optionWrapper: ViewStyle
  option: ViewStyle
  optionHovered: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    optionsContainer: {
      ...flexbox.directionRow,
      flexWrap: 'wrap',
      marginRight: -SPACING_TY
    },
    optionWrapper: {
      width: '33.33%',
      paddingRight: SPACING_TY
    },
    option: {
      ...common.borderRadiusPrimary,
      backgroundColor: theme.secondaryBackground,
      ...spacings.pvSm,
      ...flexbox.alignCenter,
      borderWidth: 1,
      borderColor: theme.secondaryBackground
    },
    optionHovered: {
      backgroundColor:
        themeType === THEME_TYPES.DARK
          ? `${String(theme.linkText)}10`
          : `${String(theme.primaryLight)}10`,
      borderWidth: 1,
      borderColor: themeType === THEME_TYPES.DARK ? theme.linkText : theme.primaryLight
    }
  })

export default getStyles
