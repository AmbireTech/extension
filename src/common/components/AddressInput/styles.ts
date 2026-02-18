import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

import getInputStyles from '../Input/styles'

interface Style {
  label: TextStyle
  domainIcons: ViewStyle
  button: ViewStyle
  bottomLabel: TextStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    label: {
      ...spacings.mbMi
    },
    domainIcons: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.mlTy
    },
    button: getInputStyles(theme).button,
    bottomLabel: {
      fontSize: 12
    }
  })

export default getStyles
