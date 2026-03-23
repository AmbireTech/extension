import React, { useCallback } from 'react'

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
