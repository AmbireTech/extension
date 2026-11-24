import { CSSProperties } from 'react'
import { StyleSheet, ViewStyle } from 'react-native'

import { SPACING, SPACING_MI, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import { ThemeProps } from '@common/styles/themeConfig'
import flexbox from '@common/styles/utils/flexbox'

export const AVATAR_SIZE = 40
/** The width of an account in the transfer between two of them, as in the design */
const TRANSFER_ACCOUNT_WIDTH = 200
export const CONNECTOR_HEIGHT = 82
/** The connector's diamond and arrow, half of which overhang the accounts it joins */
export const CONNECTOR_END_SIZE = 8.66
export const SEND_BUTTON_HEIGHT = 40
const TOKEN_ROW_WIDTH = 290
const CLOCK_SIZE = 48
/** The clock overlaps the token below it, as in the design */
const CLOCK_OVERLAP = 5

// The design's shadow under its glass, the same in both themes
const GLASS_SHADOW = '0px 12px 20px 0px rgba(0, 0, 0, 0.12)'
// The orange glow of the Privacy Pools overview card
const PRIVATE_ACCOUNT_BORDER = '1px solid rgba(255, 149, 92, 0.64)'
const PRIVATE_ACCOUNT_SHADOW = '0px 8px 16px 0px rgba(255, 149, 92, 0.24)'

interface Style {
  transfer: ViewStyle
  connector: ViewStyle
  connectorLine: ViewStyle
  tokenDetails: ViewStyle
  tokenNameAndIcon: ViewStyle
  verifyingBadge: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    transfer: {
      width: TRANSFER_ACCOUNT_WIDTH
    },
    connector: {
      ...flexbox.center,
      height: CONNECTOR_HEIGHT
    },
    // Starts half a diamond higher, so the diamond sits on the edge of the account above
    connectorLine: {
      position: 'absolute',
      top: -CONNECTOR_END_SIZE / 2
    },
    tokenDetails: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      columnGap: SPACING_SM
    },
    tokenNameAndIcon: {
      ...flexbox.directionRow,
      ...flexbox.alignCenter,
      columnGap: SPACING_TY
    },
    verifyingBadge: {
      borderWidth: 1,
      borderColor: theme.infoText
    }
  })

/**
 * `GlassView` takes CSS rather than a React Native style. Every piece of glass only shows, so
 * none looks pressable.
 */
const glass: CSSProperties = {
  alignItems: 'center',
  cursor: 'default',
  boxShadow: GLASS_SHADOW
}
const accountChip: CSSProperties = {
  ...glass,
  columnGap: SPACING_TY,
  padding: `${SPACING_MI}px ${SPACING}px ${SPACING_MI}px ${SPACING_MI}px`
}

export const glassCssStyles = {
  publicAccountChip: accountChip,
  privateAccountChip: {
    ...accountChip,
    border: PRIVATE_ACCOUNT_BORDER,
    boxShadow: PRIVATE_ACCOUNT_SHADOW
  },
  sendButton: {
    ...glass,
    height: SEND_BUTTON_HEIGHT,
    columnGap: SPACING_MI,
    padding: `0 ${SPACING_SM}px`
  },
  clock: {
    ...glass,
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    justifyContent: 'center',
    marginBottom: -CLOCK_OVERLAP,
    // Over the token, which comes after it
    zIndex: 1
  },
  tokenRow: {
    ...glass,
    width: TOKEN_ROW_WIDTH,
    justifyContent: 'space-between',
    padding: `${SPACING_TY}px ${SPACING_SM}px ${SPACING_TY}px ${SPACING_TY}px`
  }
} satisfies { [name: string]: CSSProperties }

export default getStyles
