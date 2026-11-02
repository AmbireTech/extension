import { StyleSheet, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import { BUTTON_HEIGHT } from '@common/components/Button'
import spacings, { SPACING, SPACING_TY } from '@common/styles/spacings'

interface Styles {
  footerRow: ViewStyle
  footerButtons: ViewStyle
  footerButtonsCompact: ViewStyle
  footerButtonsMobile: ViewStyle
  footerButton: ViewStyle
  footerButtonCompact: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Styles>({
    footerRow: {
      marginTop: 'auto'
    },
    footerButtons: {
      columnGap: SPACING
    },
    // The compact flat footer stacks with `column`, but Cancel and Stake fit on one row. It also
    // pads itself horizontally, which on top of the padding the screen already applies would
    // leave the buttons narrower than the cards above them
    footerButtonsCompact: {
      ...spacings.ph0,
      flexDirection: 'row'
    },
    // The mobile footer stacks with `column-reverse`, but Cancel and Stake fit on one row
    footerButtonsMobile: {
      flexDirection: 'row',
      columnGap: SPACING_TY
    },
    footerButton: {
      ...spacings.mb0,
      ...(isWeb ? spacings.phLg : {}),
      height: isWeb ? 48 : BUTTON_HEIGHT,
      borderRadius: 18
    },
    // Halves of the row, as tall as the regular size buttons in the other narrow view footers
    footerButtonCompact: {
      flex: 1,
      height: BUTTON_HEIGHT
    }
  })

export default getStyles
