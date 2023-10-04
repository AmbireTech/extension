import React, { createContext, useEffect, useMemo, useState } from 'react'
import { useColorScheme } from 'react-native'

import useRoute from '@common/hooks/useRoute'
import useStorage from '@common/hooks/useStorage'
import { ROUTES } from '@common/modules/router/constants/common'
import ThemeColors, {
  lightOnlyRoutesOnWeb,
  THEME_TYPES,
  ThemeProps
} from '@common/styles/themeConfig'

// Change the default theme to `auto` once the light theme is ready
const DEFAULT_THEME = THEME_TYPES.DARK

export interface ThemeContextReturnType {
  theme?: ThemeProps
  themeType: THEME_TYPES
  setThemeType: (item: THEME_TYPES) => void
}

const ThemeContext = createContext<ThemeContextReturnType>({
  themeType: THEME_TYPES.DARK,
  setThemeType: () => {}
})

const ThemeProvider: React.FC = ({ children }) => {
  const colorScheme = useColorScheme()
  const { path } = useRoute()

  const [themeType, setThemeType] = useStorage<THEME_TYPES>({
    key: 'theme',
    defaultValue: DEFAULT_THEME,
    isStringStorage: true
  })

  const [sessionTheme, setSessionTheme] = useState(themeType || DEFAULT_THEME)

  useEffect(() => {
    if (lightOnlyRoutesOnWeb.includes(path?.substring(1) as keyof typeof ROUTES)) {
      setSessionTheme(THEME_TYPES.LIGHT)
    } else if (
      sessionTheme !== themeType ||
      !lightOnlyRoutesOnWeb.includes(path?.substring(1) as keyof typeof ROUTES)
    ) {
      setSessionTheme(themeType as THEME_TYPES)
    }
  }, [path, themeType, setSessionTheme])

  // In Ambire v2.x the theme type was stored wrapped in quotes (by mistake).
  // Since migrating to v3.x we need to remove the quotes from the theme type.
  const isMigrationNeeded =
    !!themeType && themeType[0] === '"' && themeType[themeType.length - 1] === '"'
  const [hasMigrated, setHasMigrated] = useState<boolean>(!isMigrationNeeded)

  useEffect(() => {
    if (hasMigrated) return

    // Removes the wrapping quotes from the `themeType` coming from the storage
    const migratedThemeType = themeType!.slice(1, -1) as THEME_TYPES
    setThemeType(migratedThemeType)

    setHasMigrated(true)
  }, [hasMigrated, setHasMigrated, setThemeType, themeType])

  const theme = useMemo(() => {
    const type = sessionTheme === THEME_TYPES.AUTO ? colorScheme : sessionTheme

    const currentTheme: any = {}
    // eslint-disable-next-line no-restricted-syntax
    for (const key of Object.keys(ThemeColors)) {
      // @ts-ignore
      currentTheme[key] = ThemeColors[key][type] || ThemeColors[key][DEFAULT_THEME]
    }

    return currentTheme
  }, [sessionTheme, colorScheme])

  return (
    <ThemeContext.Provider
      value={useMemo(
        () => ({
          theme,
          themeType: sessionTheme,
          setThemeType
        }),
        [themeType, setThemeType, theme]
      )}
    >
      {hasMigrated && children}
    </ThemeContext.Provider>
  )
}

export { ThemeContext, ThemeProvider }
