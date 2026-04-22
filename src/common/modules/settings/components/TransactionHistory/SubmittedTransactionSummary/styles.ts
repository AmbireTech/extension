import { StyleSheet, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  container: ViewStyle
  header: ViewStyle
  headerMeta: ViewStyle
  footer: ViewStyle
  contentContainer: ViewStyle
  dappInteractionsColumn: ViewStyle
  dappInteractionRow: ViewStyle
  balanceChangesRightColumn: ViewStyle
  balanceChangeRow: ViewStyle
}

const getStyles = (theme: ThemeProps, themeType: ThemeType) =>
  StyleSheet.create<Style>({
    container: {
      ...common.borderRadiusPrimary,
      borderWidth: themeType === THEME_TYPES.DARK ? 0 : 1,
      borderColor: theme.secondaryBorder,
      backgroundColor: theme.secondaryBackground
    },
    header: {
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...flexbox.alignCenter
    },
    headerMeta: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    contentContainer: {
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...flexbox.alignStart,
      backgroundColor: 'transparent',
      ...spacings.phSm,
      ...spacings.pbSm
    },
    dappInteractionsColumn: {
      ...flexbox.flex1,
      ...flexbox.alignStart
    },
    dappInteractionRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    balanceChangesRightColumn: {
      ...flexbox.alignEnd
    },
    balanceChangeRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    footer: {
      ...flexbox.directionRow,
      ...flexbox.justifySpaceBetween,
      ...flexbox.flex1,
      ...flexbox.alignCenter,
      borderTopColor: theme.secondaryBorder,
      borderTopWidth: 1,
      ...spacings.pvSm
    }
  })

export default getStyles
