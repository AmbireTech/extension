import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
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
  amountInputField: ViewStyle
  amountNativeInput: TextStyle
}

// Wider than the widest amount a balance can hold, so the amount never has to wrap
const SINGLE_ROW_AMOUNT_WIDTH = 1000

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
      borderWidth: 0,
      // An amount longer than the field is clipped at its end instead of spilling out of it
      overflow: 'hidden'
    },
    // Input pads itself horizontally on top of the wrapper's padding, which would leave the value
    // sitting twice as far from the left edge as the token symbol sits from the right one
    amountInputField: {
      ...spacings.pl0,
      // Bounds the value to the space left of the token symbol and clips whatever runs past it
      overflow: 'hidden'
    },
    amountNativeInput: {
      color: theme.primaryText,
      fontSize: 16,
      textAlign: 'left',
      // Sized to fit the space beside the token symbol, a longer amount wraps onto a second row on
      // native. Room for any amount instead keeps it on one row, and amountInputField clips what
      // runs past. Left alone on web, where the field doesn't wrap and needs to follow the caret
      ...(isWeb ? {} : { width: SINGLE_ROW_AMOUNT_WIDTH })
    }
  })

export default getStyles
