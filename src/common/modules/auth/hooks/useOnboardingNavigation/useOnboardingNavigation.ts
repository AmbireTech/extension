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
   * Onboarding is a stack of screens on mobile, so every screen the user has been
   * through is still mounted and still reacting to state. Moving the flow on, or
   * rewriting its shared list, is only ever the business of the screen the user is
   * looking at: `goToNextRoute()` advances from whatever the current route is, so a
   * call from a screen further back skips a step, and two screens writing the list
   * overwrite each other. Ignored rather than gated at each call site, so a new
   * screen cannot reintroduce either. Decided when called rather than when rendered,
   * so a tap on a screen the stack has not committed as the top one yet is deferred
   * until it is (see `runWhenScreenIsOnTop`) instead of lost.
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
      goToPrevRoute: ignoreFromBackground('goToPrevRoute', context.goToPrevRoute),
      setAccountsToPersonalize: ignoreFromBackground(
        'setAccountsToPersonalize',
        context.setAccountsToPersonalize
      )
    }
  }, [context, isFocused, screenFocus])
}
