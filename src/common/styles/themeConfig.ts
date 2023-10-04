import { ColorValue } from 'react-native'

import { WEB_ROUTES } from '@common/modules/router/constants/common'

import colors from './colors'

// eslint-disable-next-line @typescript-eslint/naming-convention
export enum THEME_TYPES {
  LIGHT = 'light',
  DARK = 'dark',
  // When the theme type is set to auto by the user, the app will get the system theme
  AUTO = 'auto'
}

export type ThemeProps = {
  [key in keyof typeof ThemeColors]: ColorValue
}

const ThemeColors = {
  backgroundGradient: {
    [THEME_TYPES.LIGHT]: [colors.white, colors.white],
    [THEME_TYPES.DARK]: [colors.wooed, colors.clay]
  },
  primaryText: {
    [THEME_TYPES.LIGHT]: colors.martinique,
    [THEME_TYPES.DARK]: colors.titan
  },
  secondaryText: {
    [THEME_TYPES.LIGHT]: colors.white,
    [THEME_TYPES.DARK]: colors.black
  },
  panelBackground: {
    [THEME_TYPES.LIGHT]: colors.white,
    [THEME_TYPES.DARK]: colors.black
  },
  inputBackground: {
    [THEME_TYPES.DARK]: colors.howl,
    [THEME_TYPES.LIGHT]: colors.melrose_15
  },
  inputBorder: {
    [THEME_TYPES.DARK]: colors.howl,
    [THEME_TYPES.LIGHT]: colors.scampi_20
  },
  inputBorderFocused: {
    [THEME_TYPES.DARK]: colors.titan,
    [THEME_TYPES.LIGHT]: colors.violet
  },
  inputBorderValid: {
    [THEME_TYPES.DARK]: colors.turquoise,
    [THEME_TYPES.LIGHT]: colors.greenHaze
  },
  inputBorderInvalid: {
    [THEME_TYPES.DARK]: colors.pink,
    [THEME_TYPES.LIGHT]: colors.radicalRed
  },
  inputIcon: {
    [THEME_TYPES.DARK]: colors.titan,
    [THEME_TYPES.LIGHT]: colors.martinique_35
  },
  buttonText: {
    [THEME_TYPES.DARK]: colors.titan,
    [THEME_TYPES.LIGHT]: colors.martinique
  },
  buttonPlaceholderText: {
    [THEME_TYPES.DARK]: colors.waikawaGray,
    [THEME_TYPES.LIGHT]: colors.martinique_35
  }
}

export const lightOnlyRoutesOnMobile = []

export const lightOnlyRoutesOnWeb = [
  WEB_ROUTES.createVault,
  WEB_ROUTES.getStarted,
  WEB_ROUTES.authEmailAccount,
  WEB_ROUTES.authEmailLogin,
  WEB_ROUTES.authEmailRegister,
  WEB_ROUTES.ambireAccountJsonLogin,
  WEB_ROUTES.ambireAccountJsonLoginPasswordConfirm,
  WEB_ROUTES.ambireAccountLoginPasswordConfirm,
  WEB_ROUTES.externalSigner,
  WEB_ROUTES.onboarding
]

export default ThemeColors
