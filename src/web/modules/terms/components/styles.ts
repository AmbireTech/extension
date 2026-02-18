import { StyleSheet, TextStyle } from 'react-native'

import { FONT_FAMILIES } from '@common/hooks/useFonts'
import spacings from '@common/styles/spacings'

interface Styles {
  text: TextStyle
  bold: TextStyle
}

const styles = StyleSheet.create<Styles>({
  text: {
    ...spacings.mb,
    fontSize: 14,
    fontFamily: FONT_FAMILIES.REGULAR,
    lineHeight: 21
  },
  bold: {
    fontFamily: FONT_FAMILIES.SEMI_BOLD
  }
})

export default styles
