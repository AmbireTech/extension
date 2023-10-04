import { StyleSheet, TextStyle } from 'react-native'

import { isWeb } from '@common/config/env'

// Only on web we scale up the font because the extension width allows us to fit more content horizontally
export const TEXT_SCALE = isWeb ? 2 : 0

interface Style {
  textRegular: TextStyle
  textSmall: TextStyle
  textCaption: TextStyle
  textInfo: TextStyle
  underline: TextStyle
}

const styles = StyleSheet.create<Style>({
  textRegular: {
    fontSize: 14 + TEXT_SCALE,
    lineHeight: 21,
    letterSpacing: 0
  },
  textSmall: {
    fontSize: 12 + TEXT_SCALE,
    lineHeight: 18,
    letterSpacing: 0
  },
  textCaption: {
    fontSize: 11 + TEXT_SCALE,
    lineHeight: 17,
    letterSpacing: 0
  },
  textInfo: {
    fontSize: 10 + TEXT_SCALE,
    lineHeight: 14,
    letterSpacing: -0.25
  },
  underline: {
    textDecorationLine: 'underline'
  }
})

export default styles
