import { useContext } from 'react'

import { OnboardingContext } from '@web/modules/onboarding/contexts/onboardingContext'

export default function useOnboarding() {
  const context = useContext(OnboardingContext)

  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }

  return context
}
