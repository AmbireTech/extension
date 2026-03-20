import React, { useCallback, useEffect, useMemo } from 'react'
import { useColorScheme } from 'react-native'

import useController from '@common/hooks/useController'
import { syncStorage } from '@common/services/storage'
import { DEFAULT_THEME } from '@common/styles/theme/types'
import ThemeColors, { THEME_TYPES, ThemeProps, ThemeType } from '@common/styles/themeConfig'

import { ThemeContext } from './context'

const ThemeProvider: React.FC<{
  children: React.ReactNode
  forceThemeType?: ThemeType
}> = ({ children, forceThemeType }) => {
  const systemThemeType = useColorScheme()
  const { dispatch } = useController('WalletStateController') || {}
  const { themeType: selectedThemeType } = useController('WalletStateController').state || {}

  useEffect(() => {
    if (!selectedThemeType) return

    if (syncStorage.get('fallbackSelectedThemeType') !== selectedThemeType) {
      syncStorage.set('fallbackSelectedThemeType', selectedThemeType)
    }
  }, [selectedThemeType])

  const themeType = useMemo(() => {
    // const type = forceThemeType ?? selectedThemeType ?? syncStorage.get('fallbackSelectedThemeType')
    // NOTE: temp here
    const type = THEME_TYPES.SYSTEM

    return type === THEME_TYPES.SYSTEM
      ? (systemThemeType as THEME_TYPES.LIGHT | THEME_TYPES.DARK)
      : (type as THEME_TYPES.LIGHT | THEME_TYPES.DARK)
  }, [selectedThemeType, systemThemeType, forceThemeType])

  const theme = useMemo(() => {
    const currentTheme = Object.fromEntries(
      Object.entries(ThemeColors).map(([key, value]) => [
        key,
        (value as any)[themeType] || (value as any)[DEFAULT_THEME]
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
