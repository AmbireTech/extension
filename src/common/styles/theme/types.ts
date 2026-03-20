enum THEME_TYPES {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

const DEFAULT_THEME = THEME_TYPES.LIGHT

type ThemeType = THEME_TYPES.LIGHT | THEME_TYPES.DARK | THEME_TYPES.SYSTEM

export type { ThemeType }
export { DEFAULT_THEME, THEME_TYPES }
