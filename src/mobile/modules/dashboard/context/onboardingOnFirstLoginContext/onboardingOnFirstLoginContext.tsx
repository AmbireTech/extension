import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import useStorage from '@common/hooks/useStorage'
import { fetchGet } from '@common/services/fetch'
import { OnboardingSlide } from '@mobile/modules/dashboard/screens/OnboardingOnFirstLoginScreen/types'

// Type alias for ISO 8601 date strings
type ISODateString = string

const ONBOARDING_SLIDES_URL = 'https://relayer.ambire.com/promotions/stories'
const ONBOARDING_COMPLETED_AT_STORAGE_KEY = 'onboardingCompletedAt'

const OnBoardingOnFirstLoginContext = createContext<any>({
  markOnboardingOnFirstLoginAsCompleted: () => {},
  hasCompletedOnboarding: false
})

const OnboardingOnFirstLoginProvider: React.FC<any> = ({ children }) => {
  const { t } = useTranslation()
  const [slides, setSlides] = useState<OnboardingSlide[]>([])
  const [slidesLoading, setSlidesLoading] = useState(true)
  const [slidesError, setSlidesError] = useState('')
  const [completedOnboardingAt, setCompletedOnboardingAt] = useStorage<string>({
    key: ONBOARDING_COMPLETED_AT_STORAGE_KEY,
    defaultValue: '',
    isStringStorage: true
  })

  const markOnboardingOnFirstLoginAsCompleted = useCallback(() => {
    const completedAt: ISODateString = new Date().toISOString()

    setCompletedOnboardingAt(completedAt)
  }, [setCompletedOnboardingAt])

  const fetchSlides = useCallback(async () => {
    setSlidesError('')
    setSlidesLoading(true)

    try {
      const slidesResponse = await fetchGet(ONBOARDING_SLIDES_URL)

      if (slidesResponse.success) {
        setSlides(slidesResponse.slides)
      } else {
        throw new Error(t('Pulling the onboarding slides went wrong. Please try again later.'))
      }
    } catch (e) {
      setSlidesError(e?.message || t('Something went wrong. Please try again later.'))
    }

    setSlidesLoading(false)
  }, [t])

  const hasCompletedOnboarding = !!completedOnboardingAt
  useEffect(() => {
    if (hasCompletedOnboarding) return

    fetchSlides()
  }, [fetchSlides, hasCompletedOnboarding])

  return (
    <OnBoardingOnFirstLoginContext.Provider
      value={useMemo(
        () => ({
          markOnboardingOnFirstLoginAsCompleted,
          hasCompletedOnboarding,
          fetchSlides,
          slides,
          slidesLoading,
          slidesError
        }),
        [
          markOnboardingOnFirstLoginAsCompleted,
          hasCompletedOnboarding,
          fetchSlides,
          slides,
          slidesLoading,
          slidesError
        ]
      )}
    >
      {children}
    </OnBoardingOnFirstLoginContext.Provider>
  )
}

export { OnBoardingOnFirstLoginContext, OnboardingOnFirstLoginProvider }
