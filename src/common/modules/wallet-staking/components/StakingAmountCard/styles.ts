import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { SELECT_SIZE_TO_HEIGHT } from '@common/components/Select/styles'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import common from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  amountCard: ViewStyle
  balanceRow: ViewStyle
  switchAmountFieldMode: ViewStyle
  switchAmountFieldModeValue: TextStyle
  switchAmountFieldModeIcon: ViewStyle
  sliderRow: ViewStyle
  maxButton: ViewStyle
  tokenRow: ViewStyle
  token: ViewStyle
  tokenLabel: ViewStyle
  amountColumn: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Styles>({
    amountCard: {
      ...spacings.phSm,
      ...spacings.pvSm,
      ...spacings.mbSm,
      backgroundColor: theme.secondaryBackground,
      borderRadius: 16
    },
    balanceRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      // Sits right on top of the amount field below it, the way its own label would
      ...spacings.mbMi,
      minHeight: 24
    },
    sliderRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      // The slider lifts itself above the amount field so its value bubble isn't drawn behind it
      // (see Input's styles), and this row has to carry that lift or it only applies within itself
      zIndex: 11
    },
    maxButton: { ...spacings.mlSm },
    switchAmountFieldMode: {
      ...flexbox.flex1,
      minWidth: 0
    },
    switchAmountFieldModeValue: {
      ...spacings.mrTy,
      flexShrink: 1
    },
    switchAmountFieldModeIcon: {
      ...flexbox.center,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.primaryAccent100
    },
    tokenRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.mbSm,
      columnGap: SPACING_SM
    },
    // Matches the closed token select on the swap screen (see Select's styles), minus the arrow
    token: {
      ...flexbox.flex1,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.plTy,
      ...spacings.prSm,
      height: SELECT_SIZE_TO_HEIGHT.md,
      ...common.borderRadiusPrimary,
      backgroundColor: theme.primaryBackground
    },
    tokenLabel: {
      ...flexbox.flex1,
      ...spacings.mlTy
    },
    amountColumn: {
      ...flexbox.flex1,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifyEnd
    }
  })

export default getStyles
