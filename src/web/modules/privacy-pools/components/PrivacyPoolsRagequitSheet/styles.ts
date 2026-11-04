import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings, { SPACING, SPACING_SM } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Style {
  row: ViewStyle
  fromColumn: ViewStyle
  amountColumn: ViewStyle
  actionColumn: ViewStyle
  ragequitButton: ViewStyle
  ragequitButtonText: TextStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    row: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.phSm,
      ...spacings.pvSm,
      ...spacings.mbTy,
      ...common.borderRadiusPrimary,
      // The same space on both sides of the amount, so it stays centered
      gap: SPACING_SM,
      backgroundColor: theme.secondaryBackground
    },
    // The sides take the same share of the row, so the amount sits in its middle
    fromColumn: { flex: 1, minWidth: 0 },
    amountColumn: { width: 100, alignItems: 'center' },
    actionColumn: { flex: 1, alignItems: 'flex-end' },
    ragequitButton: { width: 116, height: 40, paddingHorizontal: SPACING },
    ragequitButtonText: { fontSize: 12, lineHeight: 24 }
  })

export default getStyles
