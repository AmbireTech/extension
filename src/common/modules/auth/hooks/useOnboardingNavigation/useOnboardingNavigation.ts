import { useContext, useMemo } from 'react'

import { isDev } from '@common/config/env'
import { useIsScreenFocused } from '@common/contexts/screenFocusContext'
import { OnboardingNavigationContext } from '@common/modules/auth/contexts/onboardingNavigationContext'

export default function useOnboardingNavigation() {
  const context = useContext(OnboardingNavigationContext)
  const isFocused = useIsScreenFocused()

  if (!context) {
    throw new Error('useOnboardingNavigation must be used within an OnboardingNavigationProvider')
  }

  /**
   * Onboarding is a stack of screens on mobile, so every screen the user has been
   * through is still mounted and still reacting to state. Moving the flow on, or
   * rewriting its shared list, is only ever the business of the screen the user is
   * looking at: `goToNextRoute()` advances from whatever the current route is, so a
   * call from a screen further back skips a step, and two screens writing the list
   * overwrite each other. Ignored rather than gated at each call site, so a new
   * screen cannot reintroduce either.
   */
  return useMemo(() => {
    if (isFocused) return context

    const ignore = (action: string) => () => {
      if (isDev) {
        console.warn(`onboarding: ignored ${action} from a screen that is not on top`)
      }
    }

    return {
      ...context,
      goToNextRoute: ignore('goToNextRoute'),
      goToPrevRoute: ignore('goToPrevRoute'),
      setAccountsToPersonalize: ignore('setAccountsToPersonalize')
    }
  }, [context, isFocused])
}
