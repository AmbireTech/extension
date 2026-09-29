import { StyleSheet, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import spacings, { SPACING, SPACING_SM } from '@common/styles/spacings'

interface Styles {
  footerRow: ViewStyle
  footerButtons: ViewStyle
  footerButtonsCompact: ViewStyle
  footerButtonsMobile: ViewStyle
  footerButton: ViewStyle
}

const getStyles = () =>
  StyleSheet.create<Styles>({
    footerRow: {
      marginTop: 'auto'
    },
    footerButtons: {
      columnGap: SPACING
    },
    // The compact flat footer stacks with `column`, which would put Cancel above Stake. It also
    // pads itself horizontally, which on top of the padding the screen already applies would
    // leave the buttons narrower than the cards above them
    footerButtonsCompact: {
      ...spacings.ph0,
      flexDirection: 'column-reverse'
    },
    footerButtonsMobile: {
      rowGap: SPACING_SM
    },
    footerButton: {
      ...spacings.mb0,
      ...(isWeb ? spacings.phLg : {}),
      height: isWeb ? 48 : 56,
      borderRadius: 18
    }
  })

export default getStyles
