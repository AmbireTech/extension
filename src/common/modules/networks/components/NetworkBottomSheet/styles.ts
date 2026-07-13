import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  item: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    item: {
      ...spacings.plTy,
      ...spacings.prLg,
      ...spacings.pvTy,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.mbTy,
      backgroundColor: theme.primaryBackground,
      borderRadius: BORDER_RADIUS_PRIMARY,
      height: 56
    }
  })

export default getStyles
