import { StyleSheet, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'

interface Styles {
  flex1: ViewStyle
  directionRow: ViewStyle
  center: ViewStyle
  alignSelfStart: ViewStyle
  alignSelfCenter: ViewStyle
  alignSelfEnd: ViewStyle
  alignCenter: ViewStyle
  alignEnd: ViewStyle
  justifyCenter: ViewStyle
  wrap: ViewStyle
  justifySpaceBetween: ViewStyle
  justifyEnd: ViewStyle
}

const styles: Styles = {
  flex1: {
    flex: 1
  },
  directionRow: {
    flexDirection: 'row'
  },
  alignCenter: {
    alignItems: 'center'
  },
  alignEnd: {
    alignItems: 'flex-end'
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
