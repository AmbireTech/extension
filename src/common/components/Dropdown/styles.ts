import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  button: ViewStyle
  dropdown: ViewStyle
  overlay: ViewStyle
  item: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    button: {
      width: 24,
      height: 24,
      position: 'relative',
      ...flexbox.justifyCenter,
      ...flexbox.alignCenter
    },
    dropdown: {
      position: 'absolute',
      backgroundColor: theme.primaryBackground,
      minWidth: 160,
      ...common.shadowSecondary,
      ...common.borderRadiusPrimary
    },
    overlay: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.backdrop
    },
    item: {
      ...spacings.phSm,
      ...common.borderRadiusPrimary,
      height: 40,
      ...flexbox.justifyCenter
    }
  })

export default getStyles
