import React, { FC, useCallback, useEffect, useRef, useState } from 'react'
import { Animated, PanResponder, ViewStyle } from 'react-native'

import Button, { Props as CommonButtonProps } from '@common/components/Button'
import useTheme from '@common/hooks/useTheme'

type Props = Omit<CommonButtonProps, 'style' | 'children' | 'childrenPosition' | 'onPress'> & {
  style?: ViewStyle
  onHoldComplete: () => void
  holdDuration?: number // in milliseconds
  holdText?: string
  completeText?: string
}

const HoldToProceedButton: FC<Props> = ({
  style,
  text = 'Hold to proceed',
  holdText = 'Sure?',
  completeText = 'Proceed',
  onHoldComplete,
  holdDuration = 1600,
  disabled,
  ...rest
}) => {
  const { theme } = useTheme()
  const progressAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(1)).current
  const [isHolding, setIsHolding] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationRef = useRef<Animated.CompositeAnimation | null>(null)
  const holdStartTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isCurrentlyHoldingRef = useRef(false)

  const startHold = useCallback(() => {
    if (disabled) return

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
          setIsCompleted(true)
          // Add a small delay before calling completion handler
          holdTimeoutRef.current = setTimeout(() => {
            onHoldComplete()
            // Don't reset the button after completion - keep it in completed state
          }, 300)
        }
      })
    }, 200)
  }, [disabled, holdDuration, progressAnim, scaleAnim, onHoldComplete])

  const endHold = useCallback(() => {
    // Don't reset if already completed
    if (isCompleted) return

    // Mark that we're no longer holding
    isCurrentlyHoldingRef.current = false

    // Clear the hold start timeout if still waiting
    if (holdStartTimeoutRef.current) {
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
  }, [
    isHolding,
    isCompleted,
    animationRef,
    holdTimeoutRef,
    holdStartTimeoutRef,
    progressAnim,
    scaleAnim
  ])

  const panResponder = useRef(
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
    })
  )

  // Update PanResponder when disabled state changes
  useEffect(() => {
    panResponder.current = PanResponder.create({
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
    })
  }, [disabled, startHold, endHold])

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
  const progressColor = isCompleted
    ? theme.successDecorative
    : isHolding
    ? theme.primary
    : 'transparent'

  return (
    <Animated.View
      style={[
        {
          position: 'relative',
          overflow: 'hidden',
          transform: [{ scale: scaleAnim }]
        },
        style
      ]}
      {...panResponder.current.panHandlers}
    >
      <Button
        style={[
          {
            minWidth: 160,
            position: 'relative',
            backgroundColor: theme.primary
          },
          style
        ]}
        hasBottomSpacing={false}
        text={buttonText}
        disabled={disabled}
        type="primary"
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
          borderRadius: 12,
          opacity: 0.3,
          zIndex: 10
        }}
      />
    </Animated.View>
  )
}

export default HoldToProceedButton
