import { StyleSheet, TextStyle, ViewStyle } from 'react-native'

import { FONT_FAMILIES } from '@common/hooks/useFonts'
import { SPACING, SPACING_SM } from '@common/styles/spacings'

type Styles = {
  inputBox: ViewStyle
  nativeInput: TextStyle
  backdrop: ViewStyle
  backdropText: TextStyle
}

/**
 * The native input and the highlight backdrop must share the exact same
 * typography, paddings and wrapping rules, otherwise the colored words drift
 * away from the (transparent) typed text.
 */
const SHARED_TEXT_STYLE: TextStyle = {
  fontFamily: FONT_FAMILIES.REGULAR,
  fontSize: 14,
  lineHeight: 21,
  letterSpacing: 0,
  paddingHorizontal: SPACING_SM,
  paddingVertical: SPACING,
  // @ts-expect-error web only
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word'
}

const getStyles = () =>
  StyleSheet.create<Styles>({
    // The paddings are moved to the native input so the box of the native
    // input matches the box of the backdrop. Longhands are required, because the
    // TextArea's own paddingVertical/paddingHorizontal would win over a `padding` shorthand.
    inputBox: { paddingHorizontal: 0, paddingVertical: 0 },
    nativeInput: {
      ...SHARED_TEXT_STYLE,
      position: 'relative',
      zIndex: 1,
      backgroundColor: 'transparent',
      // @ts-expect-error web only
      scrollbarGutter: 'stable'
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
      // Reserves the same space as the native input's scrollbar so both wrap the text at the same width
      // @ts-expect-error web only
      scrollbarGutter: 'stable'
    },
    backdropText: SHARED_TEXT_STYLE
  })

export default getStyles
