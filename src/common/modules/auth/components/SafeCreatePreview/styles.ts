import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  card: ViewStyle
  ownersCard: ViewStyle
  row: ViewStyle
  divider: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    card: {
      ...common.borderRadiusPrimary,
      ...spacings.phSm,
      ...spacings.pvSm,
      backgroundColor: theme.secondaryBackground
    },
    // The owner rows bring their own vertical padding, so the dividers run between them
    ownersCard: {
      ...common.borderRadiusPrimary,
      ...spacings.phSm,
      backgroundColor: theme.secondaryBackground
    },
    row: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.pvSm
    },
    divider: {
      height: 1,
      backgroundColor: theme.secondaryBorder
    }
  })

export default getStyles
