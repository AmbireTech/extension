import { ColorValue } from 'react-native'

import { colorPalette as colors } from './colors'

export enum Themes {
  LIGHT = 'light',
  DARK = 'dark'
}

export type Theme = {
  background: ThemeProp
  primaryText: ThemeProp
  secondaryText: ThemeProp
  panelBackground: ThemeProp
}

export type ThemeProps = {
  [key in keyof Theme]: ColorValue
}

export type ThemeProp = {
  [key in Themes]: ColorValue
}

const ThemeColors: Theme = {
  background: {
    [Themes.LIGHT]: colors.white,
    [Themes.DARK]: colors.salute
  },
  primaryText: {
    [Themes.LIGHT]: colors.black,
    [Themes.DARK]: colors.white
  },
  secondaryText: {
    [Themes.LIGHT]: colors.aluminumSilver,
    [Themes.DARK]: colors.aluminumSilver
  },
  panelBackground: {
    [Themes.LIGHT]: colors.washedBlack,
    [Themes.DARK]: colors.washedBlack
  }
}

export default ThemeColors
