import { useEffect } from 'react'
import { Animated } from 'react-native'

const PULSE_MIN_OPACITY = 0.7
const PULSE_HALF_DURATION_IN_MS = 800

/**
 * Every avatar waiting on ENS pulses in unison, so they share one animated value and one
 * animation instead of starting one of each per row. A list that mounts dozens of avatars
 * otherwise starts dozens of native animations the moment the ENS batch begins.
 */
const pulseValue = new Animated.Value(1)
let subscriberCount = 0
let pulse: Animated.CompositeAnimation | null = null

const startPulsing = () => {
  if (pulse) return

  pulse = Animated.loop(
    Animated.sequence([
      Animated.timing(pulseValue, {
        toValue: PULSE_MIN_OPACITY,
        duration: PULSE_HALF_DURATION_IN_MS,
        useNativeDriver: true
      }),
      Animated.timing(pulseValue, {
        toValue: 1,
        duration: PULSE_HALF_DURATION_IN_MS,
        useNativeDriver: true
      })
    ])
  )
  pulse.start()
}

const stopPulsing = () => {
  if (!pulse) return

  pulse.stop()
  pulse = null
  pulseValue.setValue(1)
}

/**
 * Returns the value every pulsing avatar shares. Pass whether this avatar is waiting on
 * ENS - the animation runs while at least one of them is, and stops once none are.
 */
const useSharedPulse = (isPulsing: boolean): Animated.Value => {
  useEffect(() => {
    if (!isPulsing) return undefined

    subscriberCount += 1
    startPulsing()

    return () => {
      subscriberCount -= 1
      if (subscriberCount === 0) stopPulsing()
    }
  }, [isPulsing])

  return pulseValue
}

export default useSharedPulse
