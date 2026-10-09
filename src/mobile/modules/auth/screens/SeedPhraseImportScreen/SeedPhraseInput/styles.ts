import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { FONT_FAMILIES } from '@common/hooks/useFonts'

type Styles = {
  inputWrapper: ViewStyle
  nativeInput: TextStyle
}

const getStyles = () =>
  StyleSheet.create<Styles>({
    inputWrapper: {
      backgroundColor: 'transparent',
      maxHeight: 150
    },
    // Must match the children rendered inside the native input
    nativeInput: {
      fontFamily: FONT_FAMILIES.LIGHT,
      fontSize: 14,
      padding: 0
    }
  })

export default getStyles
