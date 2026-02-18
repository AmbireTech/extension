import { StyleSheet, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'

interface Styles {
  flex1: ViewStyle
  directionRow: ViewStyle
  directionRowReverse: ViewStyle
  center: ViewStyle
  alignSelfStart: ViewStyle
  alignSelfCenter: ViewStyle
  alignSelfEnd: ViewStyle
  alignCenter: ViewStyle
  alignStart: ViewStyle
  alignEnd: ViewStyle
  justifyStart: ViewStyle
  justifyCenter: ViewStyle
  wrap: ViewStyle
  justifySpaceBetween: ViewStyle
  justifyEnd: ViewStyle
}

const styles: Styles & StyleSheet.NamedStyles<any> = {
  flex1: {
    flex: 1
  },
  directionRow: {
    flexDirection: 'row'
  },
  directionRowReverse: {
    flexDirection: 'row-reverse'
  },
  alignCenter: {
    alignItems: 'center'
  },
  alignStart: {
    alignItems: 'flex-start'
  },
  alignEnd: {
    alignItems: 'flex-end'
  },
  justifyStart: {
    justifyContent: 'flex-start'
  },
  justifyCenter: {
    justifyContent: 'center'
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  alignSelfStart: {
    alignSelf: 'flex-start'
  },
  alignSelfCenter: {
    alignSelf: 'center'
  },
  alignSelfEnd: {
    alignSelf: 'flex-end'
  },
  wrap: {
    flexWrap: 'wrap'
  },
  justifySpaceBetween: {
    justifyContent: 'space-between'
  },
  justifyEnd: {
    justifyContent: 'flex-end'
  }
}

// Spreading `StyleSheet.create` styles into another `style` object is not
// supported by react-native-web (styles are missing in the final object)
// {@link https://github.com/necolas/react-native-web/issues/1377}
export default isWeb ? styles : StyleSheet.create<Styles>(styles)
