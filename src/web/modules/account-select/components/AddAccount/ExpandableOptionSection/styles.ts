import { StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_TY } from '@common/styles/spacings'
import { ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common, { hexToRgba } from '@common/styles/utils/common'
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
      backgroundColor: hexToRgba(theme.primaryAccent, 0.2),
      borderWidth: 1,
      borderColor: theme.primaryAccent
    }
  })

export default getStyles
