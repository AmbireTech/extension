import React, { useCallback, useRef, useState } from 'react'
import { Image, LayoutChangeEvent, View } from 'react-native'
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel'

import AmbireLogoWithBackgroundAndLogotype from '@common/assets/svg/AmbireLogoWithBackgroundAndLogotype'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import backgroundImage from '@common/modules/keystore/images/background.png'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import {
  MobileLayoutContainer,
  MobileLayoutWrapperMainContent
} from '@mobile/components/MobileLayoutWrapper'
import useLegacyAccountsBackup from '@mobile/modules/auth/hooks/useLegacyAccountsBackup'
import { markMigrationOnboardingPassed } from '@mobile/services/legacyMigration/legacyMigration'

import getStyles from './styles'

const STEPS = [
  "Ambire has been rebuilt from the ground up, and data structure from the old app is not compatible with v2. Your funds are safe on-chain, but you'll need to re-import your accounts.",
  'Existing accounts with an external signer: re-import them using your seed phrase, private key, or hardware wallet.',
  'Email-based smart accounts (v1): can only be accessed on wallet.ambire.com from a backup, where you can migrate your funds to a new account.'
]

const LAST_STEP_INDEX = STEPS.length - 1
const CAROUSEL_HEIGHT = 200

const MigrationOnboardingScreen = () => {
  const { styles } = useTheme(getStyles)
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { exportEmailAccountsBackup } = useLegacyAccountsBackup()

  const carouselRef = useRef<ICarouselInstance>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  // The carousel needs an explicit width equal to its container's actual
  // laid-out width, so we measure it instead of guessing from the window.
  const [carouselWidth, setCarouselWidth] = useState(0)

  const handleCarouselLayout = useCallback((e: LayoutChangeEvent) => {
    setCarouselWidth(e.nativeEvent.layout.width)
  }, [])

  const finishOnboarding = useCallback(() => {
    markMigrationOnboardingPassed()
    navigate(ROUTES.getStarted)
  }, [navigate])

  const handleNext = useCallback(() => {
    carouselRef.current?.next()
  }, [])

  const handleExportBackup = useCallback(async () => {
    const didExport = await exportEmailAccountsBackup()
    if (didExport) finishOnboarding()
  }, [exportEmailAccountsBackup, finishOnboarding])

  const renderStep = useCallback(
    ({ item }: { item: string }) => (
      <View style={spacings.ptLg}>
        <Text fontSize={18} weight="medium" appearance="secondaryText">
          {t(item)}
        </Text>
      </View>
    ),
    [t]
  )

  return (
    <MobileLayoutContainer
      footer={
        activeIndex === LAST_STEP_INDEX ? (
          <>
            <Button type="primary" text={t('Export backup')} onPress={handleExportBackup} />
            <Button
              type="secondary"
              hasBottomSpacing={false}
              text={t('I already have a backup')}
              onPress={finishOnboarding}
            />
          </>
        ) : (
          <Button type="secondary" hasBottomSpacing={false} text={t('Next')} onPress={handleNext} />
        )
      }
    >
      <MobileLayoutWrapperMainContent>
        <View style={flexbox.flex1}>
          {/* Reuse the same banner background as the keystore unlock screen */}
          <View style={styles.hero}>
            <Image
              source={
                typeof backgroundImage === 'number' ? backgroundImage : { uri: backgroundImage }
              }
              style={styles.heroBackground}
            />
            <View style={styles.heroContent}>
              <AmbireLogoWithBackgroundAndLogotype
                withText={false}
                color="#fff"
                style={spacings.mbSm}
              />
              <Text
                fontSize={28}
                weight="semiBold"
                color="#fff"
                style={[text.center, styles.fullWidthText]}
              >
                {t('Ambire v2')}
              </Text>
              <Text
                fontSize={16}
                weight="medium"
                color="#fff"
                style={[text.center, styles.fullWidthText]}
              >
                {t('a major new version, has landed on mobile.')}
              </Text>
            </View>
          </View>

          <View style={spacings.mtLg} onLayout={handleCarouselLayout}>
            {carouselWidth > 0 && (
              <Carousel
                ref={carouselRef}
                width={carouselWidth}
                height={CAROUSEL_HEIGHT}
                data={STEPS}
                loop={false}
                onSnapToItem={setActiveIndex}
                renderItem={renderStep}
              />
            )}
          </View>

          <View style={flexbox.flex1} />

          <View style={[styles.dotsContainer, spacings.mbLg]}>
            {STEPS.map((step, index) => (
              <View key={step} style={[styles.dot, index === activeIndex && styles.dotActive]} />
            ))}
          </View>
        </View>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(MigrationOnboardingScreen)
