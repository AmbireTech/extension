import { StyleSheet, ViewStyle } from 'react-native'

import { ThemeProps } from '@common/styles/themeConfig'
import { hexToRgba } from '@common/styles/utils/common'
import flexbox from '@common/styles/utils/flexbox'

/**
 * Measured off an iOS lock screen (375pt wide device) so the keypad feels like the
 * one people unlock their phone with. iOS keeps these sizes fixed and centers the
 * grid, so a wider screen only gets wider side margins - they are not relative to
 * the width. The grid is 281pt wide, which still fits the narrowest phone we support.
 */
const KEY_SIZE = 75
const KEY_COLUMN_GAP = 28
const KEY_ROW_GAP = 16
export const KEY_FONT_SIZE = 36
const DOT_SIZE = 13
const DOT_GAP = 24
/**
 * A pressed iOS key roughly doubles its fill (measured: white at 7% at rest), so the
 * overlay is tinted with the text color to darken the key on the light theme and
 * brighten it on the dark one.
 */
const KEY_PRESSED_OPACITY = 0.1

interface Style {
  dot: ViewStyle
  dotFilled: ViewStyle
  dots: ViewStyle
  keypad: ViewStyle
  keypadRow: ViewStyle
  key: ViewStyle
  keyPressHighlight: ViewStyle
}

const getStyles = (theme: ThemeProps) =>
  StyleSheet.create<Style>({
    dot: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      backgroundColor: theme.tertiaryBackground
    },
    dotFilled: {
      backgroundColor: theme.primaryText
    },
    dots: {
      ...flexbox.directionRow,
      ...flexbox.justifyCenter,
      gap: DOT_GAP
    },
    keypad: {
      gap: KEY_ROW_GAP
    },
    keypadRow: {
      ...flexbox.directionRow,
      ...flexbox.justifyCenter,
      gap: KEY_COLUMN_GAP
    },
    key: {
      width: KEY_SIZE,
      height: KEY_SIZE,
      borderRadius: KEY_SIZE / 2,
      backgroundColor: theme.secondaryBackground,
      ...flexbox.center
    },
    keyPressHighlight: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: KEY_SIZE / 2,
      backgroundColor: hexToRgba(theme.primaryText, KEY_PRESSED_OPACITY)
    }
  })

export default getStyles
