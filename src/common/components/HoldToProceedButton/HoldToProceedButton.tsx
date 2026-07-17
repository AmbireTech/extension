import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, PanResponder, StyleProp, ViewStyle } from 'react-native'

import Button, { Props as CommonButtonProps } from '@common/components/Button'
import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import { BORDER_RADIUS_PRIMARY } from '@common/styles/utils/common'

type Props = Omit<CommonButtonProps, 'style' | 'children' | 'childrenPosition' | 'onPress'> & {
  style?: StyleProp<ViewStyle>
  onHoldComplete: () => void
  holdDuration?: number // in milliseconds
  holdText?: string
  completeText?: string
  buttonType?: 'primary' | 'dangerFilled' | 'warning'
}

const HoldToProceedButton: FC<Props> = ({
  style,
  textStyle,
  text = 'Hold to proceed',
  holdText = 'Sure?',
  completeText = 'Proceed',
  onHoldComplete,
  holdDuration = 1600,
  disabled,
  buttonType = 'primary',
  ...rest
}) => {
  const { theme } = useTheme()
  const [progressAnim] = useState(() => new Animated.Value(0))
  const [scaleAnim] = useState(() => new Animated.Value(1))
  const [isHolding, setIsHolding] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [buttonWidth, setButtonWidth] = useState<number | undefined>(undefined)
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationRef = useRef<Animated.CompositeAnimation | null>(null)
  const holdStartTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isCurrentlyHoldingRef = useRef(false)
  const isCompletedRef = useRef(false)

  const progressColorMap = {
    primary: theme.primaryAccent100,
    dangerFilled: theme.error100,
    warning: theme.warning100
  }

  // The button's background is forced to stay static and light (see progressColorMap
  // above), but Button's own per-type text color assumes a solid/dark background
  // (white text for primary/dangerFilled) or a background that darkens on hover
  // (warning). Pin the text color to match the light static background instead,
  // using the same light-bg/accent-text pairing as Badge.tsx, otherwise the text
  // is invisible (primary/dangerFilled at rest, warning on hover).
  const textColorMap = {
    primary: theme.primaryAccent,
    dangerFilled: theme.errorText,
    warning: theme.warningText
  }

  const startHold = useCallback(() => {
    if (disabled) return
    if (isCompleted) {
      onHoldComplete()
      return
    }
    // Scale down animation for immediate visual feedback
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true
    }).start()

    // Wait 200ms before starting the hold animation to distinguish from quick clicks
    holdStartTimeoutRef.current = setTimeout(() => {
      setIsHolding(true)
      isCurrentlyHoldingRef.current = true

      // Progress animation
      animationRef.current = Animated.timing(progressAnim, {
        toValue: 1,
        duration: holdDuration,
        useNativeDriver: false
      })

      animationRef.current.start(({ finished }) => {
        if (finished && isCurrentlyHoldingRef.current) {
          isCompletedRef.current = true
          setIsCompleted(true)
          // Add a small delay before calling completion handler
          holdTimeoutRef.current = setTimeout(() => {
            onHoldComplete()
            // Don't reset the button after completion - keep it in completed state
          }, 300)
        }
      })
    }, 200)
  }, [disabled, isCompleted, holdDuration, progressAnim, scaleAnim, onHoldComplete])

  const endHold = useCallback(() => {
    // Don't reset if already completed
    if (isCompletedRef.current || isCompleted) return
    // Mark that we're no longer holding
    isCurrentlyHoldingRef.current = false

    // Clear the pre-hold delay timeout if we're still in the 200ms grace period
    if (holdStartTimeoutRef.current && !isCompletedRef.current) {
      clearTimeout(holdStartTimeoutRef.current)
      holdStartTimeoutRef.current = null
    }

    // If we're in the middle of holding, stop everything
    if (isHolding) {
      // Stop the progress animation immediately
      if (animationRef.current) {
        animationRef.current.stop()
        animationRef.current = null
      }

      // Clear the completion timeout
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current)
        holdTimeoutRef.current = null
      }
    }

    // Always reset progress animation to 0 and scale animation
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start()

    // Always reset the holding state
    setIsHolding(false)
    // Don't reset isCompleted here - let it stay true if the action completed
  }, [isHolding, isCompleted, animationRef, holdTimeoutRef, progressAnim, scaleAnim])

  // Recreated synchronously on every render where disabled/startHold/endHold change
  // (not via useRef+useEffect) so panHandlers can never be stale: a ref update alone
  // doesn't trigger a re-render, which previously left the pan handlers' closures
  // bound to a prior (e.g. disabled) state for a render until something else happened
  // to re-render the component.
  const panResponder = useMemo(
    () =>
      // PanResponder.create only stores these callbacks for later gesture events, it
      // never invokes them during construction
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onStartShouldSetPanResponderCapture: () => !disabled,
        onMoveShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponderCapture: () => false,
        onPanResponderGrant: startHold,
        onPanResponderMove: (_, gestureState) => {
          // If user moves too far from the button, end the hold
          const threshold = 50
          if (Math.abs(gestureState.dx) > threshold || Math.abs(gestureState.dy) > threshold) {
            endHold()
          }
        },
        onPanResponderRelease: endHold,
        onPanResponderTerminate: endHold,
        onPanResponderTerminationRequest: () => true
      }),
    [disabled, startHold, endHold]
  )

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current)
      }
      if (holdStartTimeoutRef.current) {
        clearTimeout(holdStartTimeoutRef.current)
      }
      if (animationRef.current) {
        animationRef.current.stop()
      }
    }
  }, [])

  // Calculate button text based on state
  const buttonText = (() => {
    if (isCompleted) return completeText
    if (isHolding) return holdText
    return text
  })()

  // Calculate progress width
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp'
  })

  // Progress bar background color - using theme colors for consistency
  const progressColor = isHolding && !isCompleted ? progressColorMap[buttonType] : 'transparent'

  return (
    <Animated.View
      style={[
        {
          position: 'relative',
          overflow: 'hidden',
          borderRadius: BORDER_RADIUS_PRIMARY,
          transform: [{ scale: scaleAnim }]
        },
        style
      ]}
      {...panResponder.panHandlers}
    >
      <Button
        onLayout={(e) => {
          setButtonWidth(e.nativeEvent.layout.width)
        }}
        style={[
          {
            minWidth: buttonWidth || 108,
            position: 'relative',
            backgroundColor: progressColorMap[buttonType]
          },
          style
        ]}
        textStyle={[{ color: textColorMap[buttonType] }, textStyle]}
        size={isWeb ? 'smaller' : 'regular'}
        hasBottomSpacing={false}
        text={buttonText}
        disabled={disabled}
        type={buttonType}
        {...rest}
      />

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: progressWidth,
          backgroundColor: progressColor,
          borderRadius: BORDER_RADIUS_PRIMARY,
          opacity: isHolding && !isCompleted ? 0.3 : 0,
          zIndex: 10
        }}
      />
    </Animated.View>
  )
}

export default HoldToProceedButton
