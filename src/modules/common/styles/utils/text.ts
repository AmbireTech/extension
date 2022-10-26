import { StyleSheet, TextStyle } from 'react-native'

import { isWeb } from '@config/env'

import colors from '../colors'

interface Styles {
  highlightPrimary: TextStyle
  center: TextStyle
  right: TextStyle
  uppercase: TextStyle
  capitalize: TextStyle
  italic: TextStyle
}

const textStyles: Styles = {
  highlightPrimary: {
    color: colors.heliotrope
  },
  center: {
    textAlign: 'center'
  },
  right: {
    textAlign: 'right'
  },
  uppercase: {
    textTransform: 'uppercase'
  },
  capitalize: {
    textTransform: 'capitalize'
  },
  italic: {
    fontStyle: 'italic'
  }
}

// Spreading `StyleSheet.create` styles into another `style` object is not
// supported by react-native-web (styles are missing in the final object)
// {@link https://github.com/necolas/react-native-web/issues/1377}
export default isWeb ? textStyles : StyleSheet.create<Styles>(textStyles)
