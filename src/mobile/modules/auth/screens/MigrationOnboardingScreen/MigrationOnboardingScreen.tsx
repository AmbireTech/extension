import React, { useCallback, useRef, useState } from 'react'
import { Image, LayoutChangeEvent, View, ViewStyle } from 'react-native'
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated'
import Carousel, { ICarouselInstance } from 'react-native-reanimated-carousel'

import AmbireLogoWithBackgroundAndLogotype from '@common/assets/svg/AmbireLogoWithBackgroundAndLogotype'
import Button from '@common/components/Button'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import backgroundImage from '@common/modules/keystore/images/background.png'
import { ROUTES } from '@common/modules/router/constants/common'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { openInTab } from '@common/utils/links'
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

const WALLET_URL = 'https://wallet.ambire.com'
const LEARN_MORE_URL =
  'https://help.ambire.com/en/articles/13714255-how-to-add-your-v1-ambire-smart-account-legacy-to-the-extension'

const DOT_WIDTH = 10
const DOT_ACTIVE_WIDTH = 24

const PaginationDot = ({
  index,
  progress,
  baseStyle,
  activeColor,
  inactiveColor
}: {
  index: number
  progress: SharedValue<number>
  baseStyle: ViewStyle
  activeColor: string
  inactiveColor: string
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [index - 1, index, index + 1]

    return {
      width: interpolate(
        progress.value,
        inputRange,
        [DOT_WIDTH, DOT_ACTIVE_WIDTH, DOT_WIDTH],
        Extrapolation.CLAMP
      ),
      backgroundColor: interpolateColor(progress.value, inputRange, [
        inactiveColor,
        activeColor,
        inactiveColor
      ])
    }
  })

  return <Animated.View style={[baseStyle, animatedStyle]} />
}

const MigrationOnboardingScreen = () => {
  const { styles, theme } = useTheme(getStyles)
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { height } = useWindowSize()
  const { exportEmailAccountsBackup } = useLegacyAccountsBackup()

  const carouselRef = useRef<ICarouselInstance>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  // Tracks the carousel scroll position so the dots can animate smoothly
  // between steps instead of snapping on each slide change.
  const progress = useSharedValue(0)
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
    ({ item, index }: { item: string; index: number }) => {
      if (index === LAST_STEP_INDEX) {
        // Split the sentence around the wallet.ambire.com mention so it can be
        // rendered as an inline link without duplicating the copy.
        const [beforeLink = '', afterLink = ''] = item.split('wallet.ambire.com')

        return (
          <View style={{ ...spacings.phLg, ...(height < 700 ? spacings.pt : spacings.ptLg) }}>
            <Text fontSize={16} weight="medium" appearance="secondaryText">
              {t(beforeLink)}
              <Text
                fontSize={16}
                weight="medium"
                appearance="primary"
                underline
                onPress={() => openInTab({ url: WALLET_URL })}
              >
                wallet.ambire.com
              </Text>
              {t(afterLink)}
            </Text>
            <Text
              fontSize={16}
              weight="medium"
              appearance="primary"
              underline
              style={spacings.mtMd}
              onPress={() => openInTab({ url: LEARN_MORE_URL })}
            >
              {t('Read more')} ›
            </Text>
          </View>
        )
      }

      return (
        <Text
          fontSize={16}
          weight="medium"
          appearance="secondaryText"
          style={{ ...spacings.phLg, ...spacings.ptLg }}
        >
          {t(item)}
        </Text>
      )
    },
    [t, height]
  )

  return (
    <MobileLayoutContainer
      footer={
        <>
          <View style={[styles.dotsContainer, spacings.mbLg]}>
            {STEPS.map((step, index) => (
              <PaginationDot
                key={step}
                index={index}
                progress={progress}
                baseStyle={styles.dot}
                activeColor={theme.secondaryText as string}
                inactiveColor={theme.tertiaryText as string}
              />
            ))}
          </View>
          {activeIndex === LAST_STEP_INDEX ? (
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
            <Button
              type="secondary"
              hasBottomSpacing={false}
              text={t('Next')}
              onPress={handleNext}
            />
          )}
        </>
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
                data={STEPS}
                loop={false}
                onProgressChange={progress}
                onSnapToItem={setActiveIndex}
                renderItem={renderStep}
              />
            )}
          </View>
        </View>
      </MobileLayoutWrapperMainContent>
    </MobileLayoutContainer>
  )
}

export default React.memo(MigrationOnboardingScreen)
