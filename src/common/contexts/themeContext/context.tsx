import { createContext } from 'react'

import { DEFAULT_THEME } from '@common/styles/theme/types'
import { ThemeProps } from '@common/styles/themeConfig'

import { ThemeContextReturnType } from './types'

const ThemeContext = createContext<ThemeContextReturnType>({
  theme: {} as ThemeProps,
  themeType: DEFAULT_THEME,
  selectedThemeType: DEFAULT_THEME,
  setThemeType: () => {}
})

export { ThemeContext }
