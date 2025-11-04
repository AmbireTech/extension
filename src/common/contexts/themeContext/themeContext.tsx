import React, { createContext, useCallback, useEffect, useMemo } from 'react'
import { useColorScheme } from 'react-native'

import ThemeColors, {
  DEFAULT_THEME,
  THEME_TYPES,
  ThemeProps,
  ThemeType
} from '@common/styles/themeConfig'
import { isExtension } from '@web/constants/browserapi'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useWalletStateController from '@web/hooks/useWalletStateController'

export interface ThemeContextReturnType {
  theme: ThemeProps
  themeType: THEME_TYPES.DARK | THEME_TYPES.LIGHT
  selectedThemeType: ThemeType
  setThemeType: (item: ThemeType) => void
}

const ThemeContext = createContext<ThemeContextReturnType>({
  theme: {} as ThemeProps,
  themeType: DEFAULT_THEME,
  selectedThemeType: DEFAULT_THEME,
  setThemeType: () => {}
})

const ThemeProvider: React.FC<{
  children: React.ReactNode
  forceThemeType?: ThemeType
}> = ({ children, forceThemeType }) => {
  const systemThemeType = useColorScheme()
  const { dispatch } = useBackgroundService() || {}
  const { themeType: selectedThemeType } = useWalletStateController() || {}

  useEffect(() => {
    if (!isExtension) return
    if (!selectedThemeType) return

    if (localStorage.getItem('fallbackSelectedThemeType') !== selectedThemeType) {
      localStorage.setItem('fallbackSelectedThemeType', selectedThemeType)
    }
  }, [selectedThemeType])

  const themeType = useMemo(() => {
    let type

    if (forceThemeType) {
      type = forceThemeType
    } else {
      type = selectedThemeType || localStorage.getItem('fallbackSelectedThemeType')
    }

    if (type === THEME_TYPES.SYSTEM) {
      return systemThemeType as THEME_TYPES.LIGHT | THEME_TYPES.DARK
    }

    return type
  }, [selectedThemeType, systemThemeType, forceThemeType])

  useEffect(() => {
    if (themeType === THEME_TYPES.DARK) {
      document.body.classList.add('dark-scrollbar')
      document.body.classList.remove('light-scrollbar')
    } else {
      document.body.classList.add('light-scrollbar')
      document.body.classList.remove('dark-scrollbar')
    }
  }, [themeType])

  const theme = useMemo(() => {
    const currentTheme = Object.fromEntries(
      Object.entries(ThemeColors).map(([key, value]) => [
        key,
        value[themeType] || value[DEFAULT_THEME]
      ])
    ) as ThemeProps

    return currentTheme
  }, [themeType])

  const setThemeType = useCallback(
    (type: THEME_TYPES) => {
      dispatch({ type: 'SET_THEME_TYPE', params: { themeType: type } })
    },
    [dispatch]
  )

  const value = useMemo(
    () => ({ theme, selectedThemeType, themeType, setThemeType }),
    [theme, selectedThemeType, themeType, setThemeType]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export { ThemeContext, ThemeProvider }
