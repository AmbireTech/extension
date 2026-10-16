import './PrivacyPoolsLoadingTexts.css'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Easing, View } from 'react-native'

import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { FONT_FAMILIES } from '@common/hooks/useFonts'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

/** One shimmer sweep, from outside its text on the left to outside it on the right. */
const SWEEP_MS = 2400
/** The sweep is already this far along as its text fades in, so the band is on its way. */
const SWEEP_HEAD_START_MS = 200
/**
 * How far into the sweep its band has fully left the text. The gradient is three times the text's
 * width and the band spans 36% to 64% of it (see `shimmerStyle` and the CSS), so its trailing edge
 * crosses the text's right edge at 96% of the way.
 */
const SWEEP_EXIT_PROGRESS = 0.96
const FADE_OUT_MS = 380
/**
 * When a text starts fading out, counted from when it appears: just so that it is gone as the
 * band leaves it, the fade starting while the band's brightest part is still on its way out.
 */
const TEXT_DURATION_MS = SWEEP_MS * SWEEP_EXIT_PROGRESS - SWEEP_HEAD_START_MS - FADE_OUT_MS
/** How long each text stays when the shimmer is off (reduced motion). */
const REDUCED_MOTION_TEXT_DURATION_MS = 2600
const FADE_IN_MS = 480
/** How far a text slides while it fades, upwards like a ticker. */
const SLIDE_DISTANCE = 6

/**
 * Rotating texts shown while a Privacy Pools transfer is being prepared: proving it and pricing
 * it take a while, so this keeps the wait from looking stuck, like an AI assistant's loading
 * texts. Mount it only while loading, so every wait starts from the first text.
 *
 * Each text gets one shimmer sweep and fades out as the band leaves it, both timed from the same
 * constants, so the two never drift apart.
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

  const runningAnimation = useRef<Animated.CompositeAnimation | null>(null)
  // Read once: the shimmer's CSS turns it off for the same setting
  const [prefersReducedMotion] = useState(
    () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )

  /** Fades the current text out upwards, then the next one in from below. */
  const showNextText = useCallback(() => {
    runningAnimation.current = Animated.parallel([
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
    runningAnimation.current.start(({ finished }) => {
      if (!finished) return

      setTextIndex((index) => (index + 1) % texts.length)
      translateY.setValue(SLIDE_DISTANCE)
      runningAnimation.current = Animated.parallel([
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
      runningAnimation.current.start()
    })
  }, [opacity, texts.length, translateY])

  // Counted from when each text appears, as its sweep starts with it. With no shimmer, a plain timer
  useEffect(() => {
    const timeoutId = setTimeout(
      showNextText,
      prefersReducedMotion ? REDUCED_MOTION_TEXT_DURATION_MS : TEXT_DURATION_MS
    )

    return () => clearTimeout(timeoutId)
  }, [prefersReducedMotion, showNextText, textIndex])

  // Stops a fade still running when the wait ends
  useEffect(() => () => runningAnimation.current?.stop(), [])

  // A purple band sweeping over the primary text color - black in the light theme, white in the dark
  const shimmerStyle = useMemo(
    () => ({
      // The purple fades in and out over the middle third, so it has no hard edge
      backgroundImage: `linear-gradient(90deg, ${String(theme.primaryText)} 36%, ${String(
        theme.primaryAccent
      )} 50%, ${String(theme.primaryText)} 64%)`,
      // Set here rather than in the CSS, so the fade above is timed from the same values
      animationDuration: `${SWEEP_MS}ms`,
      animationDelay: `-${SWEEP_HEAD_START_MS}ms`,
      fontFamily: FONT_FAMILIES.MEDIUM,
      fontSize: 14,
      lineHeight: '20px'
    }),
    [theme.primaryAccent, theme.primaryText]
  )

  return (
    <View
      style={[flexbox.directionRow, flexbox.justifyCenter, spacings.pvSm]}
      testID="privacy-pools-loading-texts"
    >
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        {/* A DOM span: clipping a moving gradient to the letters needs CSS that RN Text lacks */}
        {/* Keyed by the text, so each one restarts the sweep from the start */}
        <span key={textIndex} className="privacy-pools-shimmer-text" style={shimmerStyle}>
          {texts[textIndex]}
        </span>
      </Animated.View>
    </View>
  )
}

export default React.memo(PrivacyPoolsLoadingTexts)
