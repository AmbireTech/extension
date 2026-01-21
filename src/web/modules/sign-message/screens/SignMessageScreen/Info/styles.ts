import { ImageStyle, StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  verifyingContract: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    verifyingContract: {
      backgroundColor: theme.secondaryBackground,
      borderRadius: BORDER_RADIUS_PRIMARY,
      ...flexbox.flex1,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...common.fullWidth
    }
  })

export default getStyles
