import { StyleSheet, ViewStyle } from 'react-native'

import spacings, { SPACING_MI } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    container: {
      ...flexbox.directionRow,
      ...common.borderRadiusTertiary,
      ...flexbox.alignCenter,
      ...spacings.phTy,
      paddingVertical: SPACING_MI / 2,
      backgroundColor: theme.successBackground,
      borderColor: theme.successDecorative,
      borderWidth: 1,
      borderRadius: 50
    }
  })

export default getStyles
