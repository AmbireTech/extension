import React, { ReactNode, useContext, useMemo } from 'react'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'

import { isAndroid } from '@common/config/env'

// Android reports a much smaller (gesture pill) or zero bottom inset, which makes
// screens sit noticeably lower than on iOS. Force the iOS home-indicator inset so
// every `useSafeAreaInsets` consumer below gets the same bottom spacing on both platforms.
const IOS_BOTTOM_INSET = 34

/** Overrides the bottom safe-area inset on Android with the iOS one. No-op on iOS. */
const AndroidBottomInset = ({ children }: { children: ReactNode }) => {
  const insets = useContext(SafeAreaInsetsContext)
  const forcedInsets = useMemo(
    () => (insets ? { ...insets, bottom: IOS_BOTTOM_INSET } : insets),
    [insets]
  )

  if (!isAndroid) return <>{children}</>

  return (
    <SafeAreaInsetsContext.Provider value={forcedInsets}>{children}</SafeAreaInsetsContext.Provider>
  )
}

export default AndroidBottomInset
