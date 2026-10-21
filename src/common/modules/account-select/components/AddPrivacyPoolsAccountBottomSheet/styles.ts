import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  seedRow: ViewStyle
  seedRowWithAccount: ViewStyle
  addButton: ViewStyle
  addButtonText: TextStyle
  footer: ViewStyle
  footerDivider: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    seedRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.plSm,
      ...spacings.prTy,
      ...spacings.pvTy,
      ...spacings.mbTy,
      ...common.borderRadiusPrimary,
      backgroundColor: theme.secondaryBackground
    },
    seedRowWithAccount: {
      opacity: 0.5
    },
    // The default outline border matches the row background, so it would not show
    addButton: {
      borderColor: theme.primaryText
    },
    addButtonText: {
      fontSize: 16
    },
    footer: {
      ...spacings.pbTy,
      backgroundColor: theme.primaryBackground
    },
    // A background view instead of a border, as per-side borders can leak onto
    // the next screen on native
    footerDivider: {
      ...spacings.mbTy,
      height: 1,
      backgroundColor: theme.primaryBorder
    }
  })

export default getStyles
