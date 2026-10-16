import './PrivacyPoolsLoadingTexts.css'

import React, { useEffect, useMemo, useState } from 'react'
import { Animated, Easing, View } from 'react-native'

import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { FONT_FAMILIES } from '@common/hooks/useFonts'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

/** How long each text stays before the next one replaces it. */
const TEXT_DURATION_MS = 2600
const FADE_OUT_MS = 200
const FADE_IN_MS = 260
/** How far a text slides while it fades, upwards like a ticker. */
const SLIDE_DISTANCE = 4

/**
 * Rotating texts shown while a Privacy Pools transfer is being prepared: proving it and pricing
 * it take a while, so this keeps the wait from looking stuck, like an AI assistant's loading
 * texts. Mount it only while loading, so every wait starts from the first text.
 */
const PrivacyPoolsLoadingTexts = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [textIndex, setTextIndex] = useState(0)
  const [opacity] = useState(() => new Animated.Value(1))
  const [translateY] = useState(() => new Animated.Value(0))

  const texts = useMemo(
    () => [
      t('Doing the cryptographic shuffle…'),
      t('Privacifying your transfer…'),
      t('A little less public. A lot more yours.'),
      t('Keeping your business yours…'),
      t('Minding your own business…'),
      t('Putting your funds on incognito…'),
      t('Cryptifying…')
    ],
    [t]
  )

  useEffect(() => {
    let currentAnimation: Animated.CompositeAnimation | null = null
    const intervalId = setInterval(() => {
      currentAnimation = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: FADE_OUT_MS,
          easing: Easing.in(Easing.ease),
          useNativeDriver: !isWeb
        }),
        Animated.timing(translateY, {
          toValue: -SLIDE_DISTANCE,
          duration: FADE_OUT_MS,
          easing: Easing.in(Easing.ease),
          useNativeDriver: !isWeb
        })
      ])
      currentAnimation.start(({ finished }) => {
        if (!finished) return

        setTextIndex((index) => (index + 1) % texts.length)
        translateY.setValue(SLIDE_DISTANCE)
        currentAnimation = Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: FADE_IN_MS,
            easing: Easing.out(Easing.ease),
            useNativeDriver: !isWeb
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: FADE_IN_MS,
            easing: Easing.out(Easing.ease),
            useNativeDriver: !isWeb
          })
        ])
        currentAnimation.start()
      })
    }, TEXT_DURATION_MS)

    return () => {
      clearInterval(intervalId)
      currentAnimation?.stop()
    }
  }, [opacity, texts.length, translateY])

  // The band is the primary text color sweeping over the secondary one, so it works in both themes
  const shimmerStyle = useMemo(
    () => ({
      backgroundImage: `linear-gradient(90deg, ${String(theme.secondaryText)} 40%, ${String(
        theme.primaryText
      )} 50%, ${String(theme.secondaryText)} 60%)`,
      fontFamily: FONT_FAMILIES.MEDIUM,
      fontSize: 14,
      lineHeight: '20px'
    }),
    [theme.primaryText, theme.secondaryText]
  )

  return (
    <View
      style={[flexbox.directionRow, flexbox.justifyCenter, spacings.pvSm]}
      testID="privacy-pools-loading-texts"
    >
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        {/* A DOM span: clipping a moving gradient to the letters needs CSS that RN Text lacks */}
        <span className="privacy-pools-shimmer-text" style={shimmerStyle}>
          {texts[textIndex]}
        </span>
      </Animated.View>
    </View>
  )
}

export default React.memo(PrivacyPoolsLoadingTexts)
