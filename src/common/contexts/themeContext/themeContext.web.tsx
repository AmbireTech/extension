import React, { useCallback, useEffect, useMemo } from 'react'
import { useColorScheme } from 'react-native'

import useController from '@common/hooks/useController'
import { DEFAULT_THEME } from '@common/styles/theme/types'
import ThemeColors, { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'
import { isExtension } from '@web/constants/browserapi'

import { ThemeContext } from './context'

const ThemeProvider: React.FC<{
  children: React.ReactNode
  forceThemeType?: ThemeType
}> = ({ children, forceThemeType }) => {
  const systemThemeType = useColorScheme()
  const { dispatch } = useController('WalletStateController') || {}
  const { themeType: selectedThemeType } = useController('WalletStateController').state || {}

  useEffect(() => {
    if (!isExtension) return
    if (!selectedThemeType) return

    if (localStorage.getItem('fallbackSelectedThemeType') !== selectedThemeType) {
      localStorage.setItem('fallbackSelectedThemeType', selectedThemeType)
    }
  }, [selectedThemeType])

  const themeType = useMemo(() => {
    const type =
      forceThemeType ?? selectedThemeType ?? localStorage.getItem('fallbackSelectedThemeType')

    return type === THEME_TYPES.SYSTEM
      ? (systemThemeType as THEME_TYPES.LIGHT | THEME_TYPES.DARK)
      : type
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
      dispatch({
        type: 'method',
        params: {
          method: 'setThemeType',
          args: [type]
        }
      })
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
