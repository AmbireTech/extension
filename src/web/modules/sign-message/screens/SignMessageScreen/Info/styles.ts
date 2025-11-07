import { ImageStyle, StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common, { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  image: ImageStyle
  fallbackIcon: ImageStyle
  verifyingContract: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    image: {
      alignSelf: 'flex-start',
      borderRadius: BORDER_RADIUS_PRIMARY
    },
    fallbackIcon: {
      backgroundColor: theme.secondaryBackground,
      alignSelf: 'flex-start',
      ...spacings.pvMi,
      ...spacings.phMi,
      borderRadius: BORDER_RADIUS_PRIMARY
    },
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
