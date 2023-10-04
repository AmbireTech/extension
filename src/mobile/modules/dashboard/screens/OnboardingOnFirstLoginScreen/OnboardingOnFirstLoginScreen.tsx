import { StatusBar } from 'expo-status-bar'
import AnimatedLottieView from 'lottie-react-native'
import React, { useCallback, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, StyleSheet, View } from 'react-native'
import AppIntroSlider from 'react-native-app-intro-slider'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { SafeAreaView } from 'react-native-safe-area-context'

import AmbireLogoHorizontal from '@common/components/AmbireLogoHorizontal'
import Button from '@common/components/Button'
import Spinner from '@common/components/Spinner'
import Text from '@common/components/Text'
import useNavigation from '@common/hooks/useNavigation'
import { MOBILE_ROUTES } from '@common/modules/router/constants/common'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { Portal } from '@gorhom/portal'
import useOnboardingOnFirstLogin from '@mobile/modules/dashboard/hooks/useOnboardingOnFirstLogin'

import ErrorAnimation from './error-animation.json'
import styles from './styles'
import { OnboardingSlide } from './types'

const OnboardingOnFirstLoginScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const {
    slides,
    slidesLoading,
    slidesError,
    markOnboardingOnFirstLoginAsCompleted,
    hasCompletedOnboarding,
    fetchSlides
  } = useOnboardingOnFirstLogin()

  useEffect(() => {
    // Trigger fetching slides, because by default, when the onboarding is
    //  completed the `useOnboardingOnFirstLogin` does not fetches the slides.
    if (hasCompletedOnboarding) {
      fetchSlides()
    }
  }, [fetchSlides, hasCompletedOnboarding, navigate])

  const handleComplete = useCallback(() => {
    if (!hasCompletedOnboarding) {
      markOnboardingOnFirstLoginAsCompleted()
    }

    navigate(`${MOBILE_ROUTES.dashboard}-screen`, {})
  }, [hasCompletedOnboarding, markOnboardingOnFirstLoginAsCompleted, navigate])

  const renderItem = useCallback(
    ({ item }) => (
      <SafeAreaView style={[{ backgroundColor: item.backgroundColor }, flexbox.flex1]}>
        <AmbireLogoHorizontal
          color={colors.thunder}
          style={[flexbox.alignSelfCenter, spacings.mtSm]}
        />
        <Text weight="semiBold" color={item.titleTextColor} fontSize={40} style={styles.titleText}>
          {item.titleText}
        </Text>
        <Image style={flexbox.flex1} resizeMode="contain" source={{ uri: item.image }} />
        <Text
          fontSize={20}
          weight="regular"
          color={item.descriptionTextColor}
          style={styles.descriptionText}
        >
          {item.descriptionText}
        </Text>
      </SafeAreaView>
    ),
    []
  )

  // The lib requires `key` as an unique id prop, use `id` prop instead
  const keyExtractor = useCallback((item: OnboardingSlide) => item.id.toString(), [])

  const NextButton = useCallback(
    () => (
      <Text style={styles.callToActionButton} color={colors.waikawaGray} fontSize={18}>
        {t('Next')}
      </Text>
    ),
    [t]
  )

  const DoneButton = useCallback(
    () => (
      <Text style={styles.callToActionButton} color={colors.waikawaGray} fontSize={18}>
        {t('Done')}
      </Text>
    ),
    [t]
  )

  const renderContent = () => {
    if (slidesLoading) {
      return (
        <View style={[StyleSheet.absoluteFill, flexbox.center, styles.fallbackBackground]}>
          <Spinner />
        </View>
      )
    }

    if (slidesError) {
      return (
        <View style={[StyleSheet.absoluteFill, styles.fallbackBackground]}>
          <SafeAreaView style={[flexbox.flex1, spacings.mhLg]}>
            <AmbireLogoHorizontal
              color={colors.thunder}
              style={[flexbox.alignSelfCenter, spacings.mtSm, spacings.mbLg]}
            />
            <View style={[flexbox.flex1, flexbox.justifyCenter]}>
              <AnimatedLottieView
                style={[{ width: 173, height: 173 }, flexbox.alignSelfCenter]}
                source={ErrorAnimation}
                autoPlay
                loop
              />
            </View>
            <View style={[flexbox.flex1, flexbox.center]}>
              <View style={[flexbox.flex1, flexbox.justifyCenter]}>
                <Text fontSize={20} weight="regular" color={colors.waikawaGray} style={text.center}>
                  {slidesError}
                </Text>
              </View>

              <View style={[{ width: '100%' }, spacings.mbLg]}>
                <Button
                  text={t('Try again')}
                  style={spacings.mhTy}
                  textStyle={{ fontSize: 20 }}
                  onPress={fetchSlides}
                />
                <TouchableOpacity
                  style={[flexbox.alignCenter, spacings.mb]}
                  onPress={handleComplete}
                >
                  <Text fontSize={20} weight="regular" color={colors.waikawaGray}>
                    {t('Skip')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </View>
      )
    }

    return (
      <AppIntroSlider
        dotStyle={styles.dotStyle}
        activeDotStyle={styles.activeDotStyle}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        data={slides}
        onDone={handleComplete}
        renderNextButton={NextButton}
        renderDoneButton={DoneButton}
      />
    )
  }

  const statusBarBackgroundColor = slides?.length ? slides[0]?.backgroundColor : colors.wooed

  return (
    <Portal hostName="global">
      <StatusBar style="dark" translucent={false} backgroundColor={statusBarBackgroundColor} />
      <View style={StyleSheet.absoluteFill}>{renderContent()}</View>
    </Portal>
  )
}

export default React.memo(OnboardingOnFirstLoginScreen)
