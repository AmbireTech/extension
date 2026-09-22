import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  amountCard: ViewStyle
  balanceRow: ViewStyle
  switchAmountFieldMode: ViewStyle
  switchAmountFieldModeValue: TextStyle
  switchAmountFieldModeIcon: ViewStyle
  sliderRow: ViewStyle
  maxButton: ViewStyle
  amountInput: ViewStyle
  amountInputWrapper: ViewStyle
  amountNativeInput: TextStyle
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
    amountInput: {
      ...spacings.mbSm
    },
    amountInputWrapper: {
      height: 48,
      ...spacings.phSm,
      backgroundColor: theme.tertiaryBackground,
      borderRadius: 14,
      borderWidth: 0
    },
    amountNativeInput: {
      color: theme.primaryText,
      fontSize: 16,
      textAlign: 'left'
    }
  })

export default getStyles
