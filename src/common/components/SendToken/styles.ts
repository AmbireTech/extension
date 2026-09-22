import { StyleSheet } from 'react-native'

import { isWeb } from '@common/config/env'
import { SWITCH_TOKENS_BUTTON_OVERHANG } from '@common/modules/swap-and-bridge/components/SwitchTokensButton/styles'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create({
    outerContainer: {
      borderWidth: 2,
      borderRadius: BORDER_RADIUS_PRIMARY,
      borderColor: theme.secondaryBackground,
      overflow: 'hidden'
    },
    outerContainerError: {
      borderColor: theme.errorBackground
    },
    containerError: {
      borderWidth: 1,
      borderColor: theme.errorDecorative
    },
    balanceRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      ...spacings.mbSm,
      minHeight: 24
    },
    switchAmountFieldMode: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifyEnd,
      ...flexbox.flex1,
      ...spacings.plTy,
      minWidth: 0
    },
    switchAmountFieldModeValue: {
      ...spacings.mrTy,
      flexShrink: 1
    },
    switchAmountFieldModeIcon: {
      ...flexbox.center,
      width: 20,
      height: 20,
      borderRadius: 10
    },
    tokenRow: {
      ...flexbox.flex1,
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      // On the web the gap comes from the amount column's own padding, because the select reaches
      // past the middle of the row and a gap here would push the amount out of the panel
      columnGap: isWeb ? 0 : SPACING_SM
    },
    // The select ends on the right edge of the switch tokens button, which sits half its width past
    // the middle of the panel. This column gives up exactly that much through a negative margin, so
    // the select's column - a plain flex1 taking whatever is left of the row - reaches it. A select
    // is `width: 100%` of its column (see Select's styles), so it has to be the column that grows.
    amountColumn: {
      width: '50%',
      marginLeft: -SWITCH_TOKENS_BUTTON_OVERHANG,
      // Takes the content back off the select the margin above ran the column under, and adds the
      // gap the row itself no longer carries
      paddingLeft: SWITCH_TOKENS_BUTTON_OVERHANG + SPACING_SM
    },
    // The mirror of the above, for a column that hangs off the right edge of the row: it starts on
    // the same line the select column ends on. Padding is enough here, because it shrinks a
    // `width: 100%` select rather than having to grow one.
    networkColumn: {
      width: '50%',
      paddingLeft: SWITCH_TOKENS_BUTTON_OVERHANG
    },
    slider: {
      ...spacings.ptSm,
      // The value bubble sits above the track, over the amount input, which carries a zIndex of
      // its own (see Input's styles)
      zIndex: 11
    }
  })
export default getStyles
