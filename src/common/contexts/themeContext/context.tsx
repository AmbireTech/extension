import { createContext, useEffect, useMemo } from 'react'
import { useColorScheme } from 'react-native'

import { isBenzin, isWeb } from '@common/config/env'
import { DEFAULT_THEME, THEME_TYPES, ThemeType } from '@common/styles/theme/types'
import ThemeColors, { ThemeProps } from '@common/styles/themeConfig'

import { ThemeContextReturnType } from './types'

const ThemeContext = createContext<ThemeContextReturnType>({
  theme: {} as ThemeProps,
  themeType: DEFAULT_THEME,
  selectedThemeType: DEFAULT_THEME,
  setThemeType: () => {}
})

// Context provider without dependencies on other contexts, used for ErrorBoundary
// which should be as lean as possible to prevent any additional errors.
const LeanThemeProvider: React.FC<{
  selectedThemeType: ThemeType
  children: React.ReactNode
  // local storage or sync storage
  storage: Pick<Storage, 'get' | 'set'>
  updateThemeType: (type: THEME_TYPES) => void
}> = ({ selectedThemeType, children, storage, updateThemeType }) => {
  const systemThemeType = useColorScheme()

  useEffect(() => {
    if (!selectedThemeType) return

    if (storage.get('fallbackSelectedThemeType') !== selectedThemeType) {
      storage.set('fallbackSelectedThemeType', selectedThemeType)
    }
  }, [selectedThemeType, storage])

  const themeType = useMemo(() => {
    if (isBenzin) return THEME_TYPES.LIGHT

    const type = selectedThemeType ?? storage.get('fallbackSelectedThemeType')

    return type === THEME_TYPES.SYSTEM
      ? (systemThemeType as THEME_TYPES.LIGHT | THEME_TYPES.DARK)
      : (type as THEME_TYPES.LIGHT | THEME_TYPES.DARK)
  }, [selectedThemeType, storage, systemThemeType])

  const theme = useMemo(() => {
    const currentTheme = Object.fromEntries(
      Object.entries(ThemeColors).map(([key, value]) => [
        key,
        (value as any)[themeType] || (value as any)[DEFAULT_THEME]
      ])
    ) as ThemeProps

    return currentTheme
  }, [themeType])

  useEffect(() => {
    if (!isWeb) return

    if (themeType === THEME_TYPES.DARK) {
      document.body.classList.add('dark-scrollbar')
      document.body.classList.remove('light-scrollbar')
    } else {
      document.body.classList.add('light-scrollbar')
      document.body.classList.remove('dark-scrollbar')
    }
  }, [themeType])

  const value = useMemo(
    () => ({
      theme,
      themeType,
      selectedThemeType,
      setThemeType: updateThemeType
    }),
    [selectedThemeType, theme, themeType, updateThemeType]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export { ThemeContext, LeanThemeProvider }
