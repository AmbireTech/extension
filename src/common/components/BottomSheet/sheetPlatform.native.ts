import { useMemo } from 'react'
import { ViewStyle } from 'react-native'
import { KeyboardController } from 'react-native-keyboard-controller'

import { isiOS } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import { SPACING_MD, SPACING_XL } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'

const IOS_DIM_COLOR = '#0D0E0F'
const IOS_DIM_OPACITY = { [THEME_TYPES.LIGHT]: 0.52, [THEME_TYPES.DARK]: 0.65 }

/**
 * Where the content starts below the native grabber, which overlays the top of the sheet:
 * it ends ~10pt down on iOS (5pt margin + 5pt pill) and ~20dp on Android (16dp + 4dp)
 */
export const BELOW_GRABBER_PADDING = isiOS ? SPACING_MD : SPACING_XL

/**
 * Native sheets mount their content unpresented and present it once the header over it is
 * measured, as TrueSheet would otherwise open them in two steps.
 */
export const IS_PRESENTED_ONCE_MOUNTED = true

/** Native lists show their scroll indicator only while scrolling, which sheets leave out. */
export const SHOWS_SCROLL_INDICATOR = false

/** Closes the keyboard as a sheet comes up, so it doesn't cover the sheet. */
export const dismissKeyboard = () => KeyboardController.dismiss()

/** The caller's style for the content, as is. */
export const getSheetContentStyle = (style: ViewStyle) => style

/** The TrueSheet props that differ between the platforms (a modal is a bottom sheet here too). */
export const useSheetPlatformProps = () => {
  const { themeType } = useTheme()

  // The design's iOS backdrop (a plain dark tint, no blur outside the sheet), a bit darker
  return useMemo(
    () => ({
      dimColor: isiOS ? IOS_DIM_COLOR : undefined,
      dimOpacity: isiOS ? IOS_DIM_OPACITY[themeType] : undefined
    }),
    [themeType]
  )
}
