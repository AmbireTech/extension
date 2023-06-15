import { useContext } from 'react'

import { OnBoardingOnFirstLoginContext } from '@mobile/modules/onboarding/contexts/onboardingOnFirstLoginContext'

export default function useOnboardingOnFirstLogin() {
  const context = useContext(OnBoardingOnFirstLoginContext)

  if (!context) {
    throw new Error(
      'useOnboardingOnFirstLogin must be used within an OnBoardingOnFirstLoginContext'
    )
  }

  return context
}
