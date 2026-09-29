import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

interface Styles {
  container: ViewStyle
  measure: ViewStyle
  measuredValue: TextStyle
  fiatSign: TextStyle
  inputContainer: ViewStyle
}

/** Wider than the widest amount a balance can hold, so a native input never has to wrap it. */
export const SINGLE_ROW_AMOUNT_WIDTH = 1000

/** Room past the end of the measured value for the caret, so it isn't clipped at the edge. */
export const CARET_ROOM = 4

const styles = StyleSheet.create<Styles>({
  container: {
    ...flexbox.flex1,
    ...flexbox.directionRow,
    ...flexbox.alignCenter,
    ...flexbox.justifyEnd,
    // The measuring copy of the value below is far wider than the field
    overflow: 'hidden'
  },
  // Lays the value out at its own width, unbounded by the field, to size the input to it
  measure: {
    position: 'absolute',
    left: 0,
    width: SINGLE_ROW_AMOUNT_WIDTH,
    opacity: 0
  },
  measuredValue: {
    alignSelf: 'flex-start'
  },
  // Sits on the value's baseline rather than a pixel below it
  fiatSign: {
    transform: [{ translateY: -1 }]
  },
  // Sized to the value by the caller, and shrinks to what the field has left when the value is
  // wider than that, clipping the rest
  inputContainer: {
    ...spacings.mb0,
    flexShrink: 1,
    minWidth: 0,
    overflow: 'hidden'
  }
})

export default styles
