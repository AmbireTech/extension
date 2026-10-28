import { useContext, useMemo } from 'react'

import {
  runWhenScreenIsOnTop,
  useIsScreenFocused,
  useScreenFocusStore
} from '@common/contexts/screenFocusContext'
import { OnboardingNavigationContext } from '@common/modules/auth/contexts/onboardingNavigationContext'

export default function useOnboardingNavigation() {
  const context = useContext(OnboardingNavigationContext)
  const isFocused = useIsScreenFocused()
  const screenFocus = useScreenFocusStore()

  if (!context) {
    throw new Error('useOnboardingNavigation must be used within an OnboardingNavigationProvider')
  }

  /**
   * Onboarding is a stack of screens on mobile, all still mounted and reacting to state, and
   * `goToNextRoute()` advances from the current route - so a screen further back moving the
   * flow on skips a step. Handled here rather than at each call site; a tap on a screen not
   * yet committed as the top one is deferred until it is (see `runWhenScreenIsOnTop`).
   */
  return useMemo(() => {
    if (isFocused) return context

    const ignoreFromBackground =
      <Args extends unknown[]>(action: string, fn: (...args: Args) => void) =>
      (...args: Args) =>
        runWhenScreenIsOnTop(screenFocus, `onboarding: ${action}`, () => fn(...args))

    return {
      ...context,
      goToNextRoute: ignoreFromBackground('goToNextRoute', context.goToNextRoute),
      goToPrevRoute: ignoreFromBackground('goToPrevRoute', context.goToPrevRoute)
    }
  }, [context, isFocused, screenFocus])
}
