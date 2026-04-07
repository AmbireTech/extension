import ThemeColors, { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'

export interface ThemeContextReturnType {
  theme: ThemeProps
  themeType: THEME_TYPES.DARK | THEME_TYPES.LIGHT
  selectedThemeType: ThemeType
  setThemeType: (item: ThemeType) => void
}
