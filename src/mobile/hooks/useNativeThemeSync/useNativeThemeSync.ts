import { useEffect } from 'react'
import { Appearance, StatusBar } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import { THEME_TYPES } from '@common/styles/theme/types'

/**
 * Mirrors the in-app theme onto the parts of the UI that the OS owns: the
 * appearance the native side resolves its resources with (iOS asset catalogs and
 * status bar text, Android DayNight resources) and the status bar content color.
 *
 * Without it both stay in the system's appearance for the whole session, so a
 * light in-app theme on a dark system ends up with white status bar icons on our
 * white background (and vice versa).
 *
 * Applied only once the splash screen is gone. The splash is rendered by the OS
 * before any JS runs, so it always follows the system appearance - overriding
 * ours earlier would recolor it (and the status bar above it) mid-flight.
 */
const useNativeThemeSync = (isSplashHidden: boolean) => {
  const { themeType, selectedThemeType } = useTheme()

  useEffect(() => {
    if (!isSplashHidden) return

    // `null` maps to `unspecified`, which restores following the system. Passing
    // the resolved theme instead would mask the system value from
    // `useColorScheme`, freezing the "System" option on whatever it was applied
    // with until the next app start.
    Appearance.setColorScheme(selectedThemeType === THEME_TYPES.SYSTEM ? null : themeType)

    StatusBar.setBarStyle(themeType === THEME_TYPES.DARK ? 'light-content' : 'dark-content', true)
  }, [isSplashHidden, selectedThemeType, themeType])
}

export default useNativeThemeSync
