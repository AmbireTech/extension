import { StyleSheet, TextStyle } from 'react-native'

import { isWeb } from '@common/config/env'

interface Styles {
  highlightPrimary: TextStyle
  center: TextStyle
  right: TextStyle
  left: TextStyle
  uppercase: TextStyle
  capitalize: TextStyle
  italic: TextStyle
  underline: TextStyle
}

const textStyles: Styles = {
  center: {
    textAlign: 'center'
  },
  right: {
    textAlign: 'right'
  },
  left: {
    textAlign: 'left'
  },
  uppercase: {
    textTransform: 'uppercase'
  },
  capitalize: {
    textTransform: 'capitalize'
  },
  italic: {
    fontStyle: 'italic'
  },
  underline: {
    textDecorationLine: 'underline'
  }
}

// Spreading `StyleSheet.create` styles into another `style` object is not
// supported by react-native-web (styles are missing in the final object)
// {@link https://github.com/necolas/react-native-web/issues/1377}
export default isWeb ? textStyles : StyleSheet.create<Styles>(textStyles)
