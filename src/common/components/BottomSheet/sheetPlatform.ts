import './backdrop-style.css'

import { useMemo } from 'react'
import { StyleSheet, useWindowDimensions, ViewStyle } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import { SPACING_MD } from '@common/styles/spacings'

import { SheetPlatformOptions } from './sheetPlatform.types'

/** How wide a centered sheet is unless its style says otherwise, as the Modalize modal was. */
const MODAL_MAX_WIDTH = 540

/** Where the content starts below the grabber, which ends 12px down (8px margin + 4px pill). */
export const BELOW_GRABBER_PADDING = SPACING_MD

/** On web TrueSheet mounts the content only as it presents, so the sheet presents right away. */
export const IS_PRESENTED_ONCE_MOUNTED = false

/** A mouse user scrolls with the scrollbar too, so web keeps it. */
export const SHOWS_SCROLL_INDICATOR = true

/** The keyboard on web belongs to the focused field, which the sheet doesn't take focus from. */
export const dismissKeyboard = () => Promise.resolve()

/** The width a caller's style gives the Modalize box, which sizes a centered card on web. */
const getCardWidth = (style: ViewStyle) => {
  const { maxWidth, width } = StyleSheet.flatten(style)
  if (typeof maxWidth === 'number') return maxWidth
  if (typeof width === 'number') return width

  return MODAL_MAX_WIDTH
}

/**
 * The caller's style for the content: its fixed width sizes the card instead, and its vertical
 * padding, which spaced the Modalize box, would double the spacing the header and edge give.
 */
export const getSheetContentStyle = (style: ViewStyle): ViewStyle => {
  const contentStyle = { ...StyleSheet.flatten(style) }
  if (contentStyle.padding !== undefined) {
    contentStyle.paddingHorizontal = contentStyle.paddingHorizontal ?? contentStyle.padding
  }
  if (typeof contentStyle.width === 'number') delete contentStyle.width
  delete contentStyle.maxWidth
  delete contentStyle.padding
  delete contentStyle.paddingVertical
  delete contentStyle.paddingTop
  delete contentStyle.paddingBottom

  return contentStyle
}

/** The TrueSheet props that differ between the platforms. */
export const useSheetPlatformProps = ({ isModal, modalTopOffset, style }: SheetPlatformOptions) => {
  const { theme } = useTheme()
  const { height } = useWindowDimensions()
  const modalMaxWidth = getCardWidth(style)

  return useMemo(
    () => ({
      // A modal is a centered card in a wide window; in a narrow one it is a bottom sheet, as
      // on the phone
      presentation: isModal ? ('form' as const) : ('page' as const),
      maxContentWidth: isModal ? modalMaxWidth : undefined,
      // A full height sheet stops below the app's header, as it did with Modalize
      maxContentHeight: isModal ? undefined : height - modalTopOffset,
      // The app's backdrop color, which carries its own opacity
      dimColor: theme.backdrop,
      dimOpacity: 1,
      // In the app's theme, as TrueSheet follows the system's
      grabberOptions: { color: theme.neutral600 }
    }),
    [isModal, modalMaxWidth, height, modalTopOffset, theme]
  )
}
