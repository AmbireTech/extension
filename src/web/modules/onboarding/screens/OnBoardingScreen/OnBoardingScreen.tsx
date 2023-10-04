import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import Text from '@common/components/Text'
import { THEME_TYPES } from '@common/styles/themeConfig'
import {
  AuthLayoutWrapperMainContent,
  AuthLayoutWrapperSideContent
} from '@web/components/AuthLayoutWrapper/AuthLayoutWrapper'
import ConfettiLogo from '@web/modules/onboarding/components/ConfettiLogo'
import PinExtension from '@web/modules/onboarding/components/PinExtension/PinExtension'
import { ONBOARDING_VALUES } from '@web/modules/onboarding/contexts/onboardingContext/types'
import useOnboarding from '@web/modules/onboarding/hooks/useOnboarding'

import styles from './styles'

const OnBoardingScreen = () => {
  const { t } = useTranslation()

  const { setOnboardingStatus } = useOnboarding()
  useEffect(() => {
    setOnboardingStatus(ONBOARDING_VALUES.ON_BOARDED)
  }, [setOnboardingStatus])

  return (
    <>
      <AuthLayoutWrapperMainContent>
        <ConfettiLogo />
        <Text
          shouldScale={false}
          fontSize={20}
          weight="medium"
          style={styles.title}
        >
          {t('You are ready!')}
        </Text>
        <PinExtension style={styles.pinExtension} />
      </AuthLayoutWrapperMainContent>
      <AuthLayoutWrapperSideContent backgroundType="beta" style={styles.sideContent} />
    </>
  )
}

export default OnBoardingScreen
