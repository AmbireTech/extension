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
  holdDuration = 2000,
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

  const resetButton = useCallback(() => {
    setIsHolding(false)
    setIsCompleted(false)
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current)
      holdTimeoutRef.current = null
    }
    if (animationRef.current) {
      animationRef.current.stop()
      animationRef.current = null
    }
    Animated.parallel([
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start()
  }, [progressAnim, scaleAnim])

  const startHold = useCallback(() => {
    if (disabled) return

    setIsHolding(true)

    // Scale down animation for visual feedback
    Animated.timing(scaleAnim, {
      toValue: 0.98,
      duration: 100,
      useNativeDriver: true
    }).start()

    // Progress animation
    animationRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: holdDuration,
      useNativeDriver: false
    })

    animationRef.current.start(({ finished }) => {
      if (finished) {
        setIsCompleted(true)
        // Add a small delay before calling completion handler
        holdTimeoutRef.current = setTimeout(() => {
          onHoldComplete()
          resetButton()
        }, 300)
      }
    })
  }, [disabled, holdDuration, progressAnim, scaleAnim, resetButton, onHoldComplete])

  const endHold = useCallback(() => {
    if (!isHolding) return
    resetButton()
  }, [isHolding, resetButton])

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onStartShouldSetPanResponderCapture: () => !disabled,
      onMoveShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: startHold,
      onPanResponderRelease: endHold,
      onPanResponderTerminate: endHold
    })
  ).current

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (holdTimeoutRef.current) {
        clearTimeout(holdTimeoutRef.current)
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

  // Progress bar background color - using available theme colors
  const progressColor = isCompleted ? '#22c55e' : isHolding ? theme.primary : 'transparent'

  return (
    <Animated.View
      style={[
        {
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 12,
          transform: [{ scale: scaleAnim }]
        },
        style
      ]}
      {...panResponder.panHandlers}
    >
      <Button
        style={[
          {
            minWidth: 160,
            position: 'relative',
            backgroundColor: isCompleted ? '#22c55e' : isHolding ? theme.primary : undefined
          },
          style
        ]}
        hasBottomSpacing={false}
        text={buttonText}
        disabled={disabled}
        type={isCompleted ? 'primary' : isHolding ? 'primary' : 'primary'}
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
