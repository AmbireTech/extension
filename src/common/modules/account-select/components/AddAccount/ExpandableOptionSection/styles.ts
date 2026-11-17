import { StyleSheet, ViewStyle } from 'react-native'

import { BUTTON_HEIGHT } from '@common/components/Button'
import spacings from '@common/styles/spacings'
import { ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  optionsContainer: ViewStyle
  option: ViewStyle
  optionHovered: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    optionsContainer: {},
    optionWrapper: {},
    option: {
      ...spacings.phSm,
      height: BUTTON_HEIGHT,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...common.borderRadiusPrimary
    },
    optionHovered: {
      backgroundColor: theme.primaryBackground
    }
  })

export default getStyles
