import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  card: ViewStyle
  row: ViewStyle
  divider: ViewStyle
  networksIcon: ViewStyle
}

const NETWORKS_ICON_SIZE = 36

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    // The rows bring their own vertical padding, so the dividers run between them
    card: {
      ...common.borderRadiusPrimary,
      ...spacings.phSm,
      borderWidth: 1,
      borderColor: theme.secondaryBorder,
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
    },
    networksIcon: {
      ...flexbox.center,
      ...spacings.mrSm,
      width: NETWORKS_ICON_SIZE,
      height: NETWORKS_ICON_SIZE,
      borderRadius: NETWORKS_ICON_SIZE / 2,
      backgroundColor: theme.tertiaryBackground
    }
  })

export default getStyles
