import { ColorValue } from 'react-native'

import { ACCENT_PRIMITIVES, FEEDBACK_PRIMITIVES, NEUTRAL_PRIMITIVES } from './theme/primitives'
import { THEME_TYPES, ThemeType } from './theme/types'
import { hexToRgba } from './utils/common'

const ThemeColors = {
  ...NEUTRAL_PRIMITIVES,
  ...ACCENT_PRIMITIVES,
  ...FEEDBACK_PRIMITIVES,
  // --- Background tokens ---
  primaryBackground: NEUTRAL_PRIMITIVES.neutral300,
  secondaryBackground: NEUTRAL_PRIMITIVES.neutral100,
  tertiaryBackground: NEUTRAL_PRIMITIVES.neutral400,
  /**
   * @deprecated
   */
  secondaryBackgroundInverted: NEUTRAL_PRIMITIVES.neutral700,
  /**
   * @deprecated
   */
  quaternaryBackground: NEUTRAL_PRIMITIVES.neutral400,
  /**
   * @deprecated
   */
  primaryBackgroundInverted: NEUTRAL_PRIMITIVES.neutral900,
  // --- Text tokens ---
  primaryText: NEUTRAL_PRIMITIVES.neutral900,
  secondaryText: NEUTRAL_PRIMITIVES.neutral600,
  tertiaryText: NEUTRAL_PRIMITIVES.neutral500,
  // --- Border tokens ---
  primaryBorder: NEUTRAL_PRIMITIVES.neutral100,
  secondaryBorder: NEUTRAL_PRIMITIVES.neutral300,
  // --- Icon tokens ---
  iconPrimary: NEUTRAL_PRIMITIVES.neutral500,
  /**
   * @deprecated
   */
  iconSecondary: NEUTRAL_PRIMITIVES.neutral500,
  // --- Accent tokens ---
  /**
   * @deprecated - please use primaryAccent
   */
  primary: ACCENT_PRIMITIVES.primaryAccent200,
  primaryAccent: ACCENT_PRIMITIVES.primaryAccent200,
  primaryAccentHovered: ACCENT_PRIMITIVES.primaryAccent300,
  secondaryAccent: ACCENT_PRIMITIVES.secondaryAccent500,
  secondaryAccentHovered: ACCENT_PRIMITIVES.secondaryAccent400,
  // --- Feedback tokens ---
  infoText: FEEDBACK_PRIMITIVES.info300,
  infoDecorative: FEEDBACK_PRIMITIVES.info300,
  infoBackground: FEEDBACK_PRIMITIVES.info100,
  successText: FEEDBACK_PRIMITIVES.success400,
  successDecorative: FEEDBACK_PRIMITIVES.success300,
  successBackground: FEEDBACK_PRIMITIVES.success100,
  warningText: FEEDBACK_PRIMITIVES.warning400,
  warningDecorative: FEEDBACK_PRIMITIVES.warning300,
  warningBackground: FEEDBACK_PRIMITIVES.warning100,
  warningDecorative2: {
    [THEME_TYPES.DARK]: '#FBBA27',
    [THEME_TYPES.LIGHT]: '#FBBA27'
  },
  errorText: FEEDBACK_PRIMITIVES.error300,
  errorDecorative: FEEDBACK_PRIMITIVES.error300,
  errorBackground: FEEDBACK_PRIMITIVES.error100,
  // --- Other tokens ---
  backdrop: {
    // @TODO: Sync up with miro
    [THEME_TYPES.LIGHT]: `rgba(0, 0, 0, 0.5)`,
    [THEME_TYPES.DARK]: `rgba(0, 0, 0, 0.5)`
  },
  // @TODO: Sync up with miro
  linkText: ACCENT_PRIMITIVES.primaryAccent300,
  /**
   * @deprecated
   */
  projectedRewards: {
    [THEME_TYPES.DARK]: '#D7FF00',
    [THEME_TYPES.LIGHT]: '#8B3DFF'
  }
} as const

type ThemeProps = {
  [key in keyof typeof ThemeColors]: ColorValue
}

// Backwards compatibility
export type { ThemeType, ThemeProps }
export { THEME_TYPES }

export default ThemeColors
