import { StyleSheet } from 'react-native'

import { isWeb } from '@common/config/env'
import { SWITCH_TOKENS_BUTTON_OVERHANG } from '@common/modules/swap-and-bridge/components/SwitchTokensButton/styles'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create({
    // A ring in the panel's own colour until there is an error, so the panel doesn't resize for one
    outerContainer: {
      borderWidth: 2,
      borderRadius: BORDER_RADIUS_PRIMARY,
      borderColor: theme.secondaryBackground,
      overflow: 'hidden'
    },
    outerContainerError: {
      borderColor: theme.errorBackground
    },
    container: {
      // magic number to match the curve of the outer container
      // which is with borderRadius: 16
      borderRadius: 13,
      ...spacings.pvSm,
      ...spacings.prSm
    },
    containerError: {
      borderWidth: 1,
      borderColor: theme.errorDecorative
    },
    message: {
      ...spacings.mlMi,
      ...spacings.mtMi
    },
    balanceRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...flexbox.justifySpaceBetween,
      // Sits right on top of the select below it, the way a field's own label would
      ...spacings.mbMi,
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
    tokenRowEven: {
      columnGap: SPACING_SM
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
    // On native the select keeps the wider part of the row, and the amount lines up at its end
    nativeAmountColumn: {
      ...flexbox.flex1,
      maxWidth: '40%'
    },
    // An even split: the amount gets the same width as the token beside it
    evenAmountColumn: {
      ...flexbox.flex1
    },
    // The amount and whatever the caller shows beside it
    amount: {
      ...flexbox.flex1,
      ...flexbox.directionRow,
      ...flexbox.alignCenter
    },
    amountAccessory: { ...spacings.mlSm },
    // The mirror of the above, for a column that hangs off the right edge of the row: it starts on
    // the same line the select column ends on. Padding is enough here, because it shrinks a
    // `width: 100%` select rather than having to grow one.
    networkColumn: {
      width: '50%',
      paddingLeft: SWITCH_TOKENS_BUTTON_OVERHANG
    },
    sliderRow: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      ...spacings.ptSm,
      // The value bubble sits above the track, over the amount input, which carries a zIndex of
      // its own (see Input's styles)
      zIndex: 11
    },
    maxButton: { ...spacings.mlSm }
  })

export default getStyles
