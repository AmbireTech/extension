import React, { FC, useEffect, useMemo, useRef, useState } from 'react'
import { AccessibilityInfo, Animated, Easing, View } from 'react-native'

import SuccessAnimation from '@common/components/SuccessAnimation'
import Text from '@common/components/Text'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'

import type { SafeSignatureAddedState } from '@common/hooks/useSign/useSign'

type Props = Pick<SafeSignatureAddedState, 'signedCount' | 'threshold' | 'closesAt'> & {
  /**
   * Called once the exit animation has ended, which is when the request should close
   */
  onExitEnd: () => void
}

const ENTRY_DURATION_MS = 300
const EXIT_DURATION_MS = 400
const ENTRY_SLIDE_DISTANCE = 16
const EXIT_SLIDE_DISTANCE = 32

// The content goes from 0 (not shown yet) to 1 (shown) on entry and from 1 to 2 (gone) on exit
const HIDDEN_BEFORE_ENTRY = 0
const SHOWN = 1
const GONE_AFTER_EXIT = 2

/**
 * Shown briefly after a Safe "Sign & Close", before the request closes on its own.
 * Makes it clear that only a signature was added - the transaction itself
 * can be sent once the rest of the required signatures are added.
 * The content slides in, then slides down and fades out before the request closes,
 * which shows that it's closing without a countdown
 */
const SafeSignatureAdded: FC<Props> = ({ signedCount, threshold, closesAt, onExitEnd }) => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [phase] = useState(() => new Animated.Value(HIDDEN_BEFORE_ENTRY))
  const [isReduceMotionEnabled, setIsReduceMotionEnabled] = useState(false)
  // Read when the exit ends, so a new callback from the parent doesn't restart the animations
  const onExitEndRef = useRef(onExitEnd)

  useEffect(() => {
    onExitEndRef.current = onExitEnd
  }, [onExitEnd])

  useEffect(() => {
    let isUnmounted = false
    let exitTimeout: ReturnType<typeof setTimeout> | undefined

    const animateTo = (
      toValue: number,
      duration: number,
      easing: (value: number) => number,
      onEnd?: () => void
    ) =>
      Animated.timing(phase, { toValue, duration, easing, useNativeDriver: !isWeb }).start(
        ({ finished }) => {
          // Not finished when stopped early, e.g. on unmount, so it doesn't close then
          if (finished) onEnd?.()
        }
      )

    AccessibilityInfo.isReduceMotionEnabled()
      .catch((error: unknown) => {
        // Only decides between sliding and a plain fade, so it falls back to sliding
        console.error('Failed to read the reduce motion setting', error)
        captureException(error)
        return false
      })
      .then((isReduceMotion) => {
        if (isUnmounted) return

        setIsReduceMotionEnabled(isReduceMotion)
        animateTo(SHOWN, ENTRY_DURATION_MS, Easing.out(Easing.cubic))

        // Ends at closesAt, then the request closes. Shorter when the screen showed up late,
        // e.g. after a remount
        const msUntilExit = closesAt - Date.now() - EXIT_DURATION_MS
        exitTimeout = setTimeout(
          () => {
            const exitDuration = Math.min(EXIT_DURATION_MS, Math.max(0, closesAt - Date.now()))
            animateTo(GONE_AFTER_EXIT, exitDuration, Easing.in(Easing.cubic), () =>
              onExitEndRef.current()
            )
          },
          Math.max(0, msUntilExit)
        )
      })
      .catch((error: unknown) => {
        // The request still closes through the fallback in useSign
        console.error('Failed to animate the Safe signature success state', error)
        captureException(error)
      })

    return () => {
      isUnmounted = true
      clearTimeout(exitTimeout)
      phase.stopAnimation()
    }
  }, [closesAt, phase])

  const animatedStyle = useMemo(
    () => ({
      opacity: phase.interpolate({
        inputRange: [HIDDEN_BEFORE_ENTRY, SHOWN, GONE_AFTER_EXIT],
        outputRange: [0, 1, 0]
      }),
      transform: [
        {
          translateY: phase.interpolate({
            inputRange: [HIDDEN_BEFORE_ENTRY, SHOWN, GONE_AFTER_EXIT],
            // A plain fade for users who turned motion off
            outputRange: isReduceMotionEnabled
              ? [0, 0, 0]
              : [ENTRY_SLIDE_DISTANCE, 0, EXIT_SLIDE_DISTANCE]
          })
        }
      ]
    }),
    [phase, isReduceMotionEnabled]
  )

  return (
    <View
      style={[flexbox.flex1, flexbox.center, { backgroundColor: theme.primaryBackground }]}
      testID="safe-signature-added"
    >
      <Animated.View style={[flexbox.alignCenter, spacings.ph, animatedStyle]}>
        <SuccessAnimation />
        <Text fontSize={20} weight="medium" style={[spacings.mbTy, text.center]}>
          {t('Signature added')}
        </Text>
        <Text fontSize={14} weight="medium" appearance="secondaryText" style={text.center}>
          {t(
            '{{signedCount}} of {{threshold}} signatures added. Once the rest are added, the transaction can be sent.',
            { signedCount, threshold }
          )}
        </Text>
      </Animated.View>
    </View>
  )
}

export default React.memo(SafeSignatureAdded)
