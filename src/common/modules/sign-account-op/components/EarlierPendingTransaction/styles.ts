import type { ViewStyle } from 'react-native'
import { StyleSheet } from 'react-native'

import spacings from '@common/styles/spacings'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

import type { ThemeProps } from '@common/styles/themeConfig'

interface Styles {
  transactionCard: ViewStyle
  transactionCardCall: ViewStyle
  transactionCardDivider: ViewStyle
  transactionCardActions: ViewStyle
  transactionCardActionsRow: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    // Same look as a single CompactHumanizedCalls item, extended to hold the actions
    transactionCard: {
      borderRadius: 8,
      overflow: 'hidden',
      backgroundColor: hexToRgba(theme.primaryBackground, 0.75)
    },
    // The card already has the background, so the call inside it must not add another one
    transactionCardCall: {
      backgroundColor: 'transparent'
    },
    transactionCardDivider: {
      height: 1,
      ...spacings.mhTy,
      backgroundColor: theme.primaryBorder
    },
    transactionCardActions: {
      ...spacings.phTy,
      ...spacings.pvTy
    },
    transactionCardActionsRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    }
  })

export default getStyles
