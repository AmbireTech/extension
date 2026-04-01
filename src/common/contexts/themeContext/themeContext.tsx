import React, { useCallback } from 'react'
import { Appearance } from 'react-native'

import useController from '@common/hooks/useController'
import { THEME_TYPES } from '@common/styles/themeConfig'

import { LeanThemeProvider, ThemeContext } from './context'

const ThemeProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { dispatch } = useController('WalletStateController') || {}

  const { themeType: selectedThemeType } = useController('WalletStateController')?.state || {}

  const setThemeType = useCallback(
    (type: THEME_TYPES) => {
      if (type !== THEME_TYPES.SYSTEM) Appearance.setColorScheme(type)

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

  return (
    <LeanThemeProvider selectedThemeType={selectedThemeType} updateThemeType={setThemeType}>
      {children}
    </LeanThemeProvider>
  )
}

export { ThemeContext, ThemeProvider }
