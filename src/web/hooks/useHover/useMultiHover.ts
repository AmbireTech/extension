import { useCallback, useEffect, useMemo, useState } from 'react'
import { Animated, ColorValue, GestureResponderEvent, MouseEvent, ViewStyle } from 'react-native'

import useDeepMemo from '@common/hooks/useDeepMemo'

import DURATIONS from './durations'

export type AnimationValues = {
  property: keyof ViewStyle
  from: number | ColorValue
  to: number | ColorValue
  duration?: number
}

type AnimationValuesExtended = AnimationValues & {
  value: Animated.Value
  duration: number
}

interface Props {
  values: AnimationValues[]
  forceHoveredStyle?: boolean
}

/*
  Some of the values have to be interpolated, like backgroundColor, color, borderColor
*/
const INTERPOLATE_PROPERTIES = ['backgroundColor', 'color', 'borderColor']

const useMultiHover = ({ values, forceHoveredStyle = false }: Props) => {
  const memoizedValues = useDeepMemo(values)
  const [isHovered, setIsHovered] = useState(false)

  const animatedValues = useMemo(() => {
    const opacity = memoizedValues.find(({ property }) => property === 'opacity')

    const newValues = memoizedValues.map(({ property, from, to, duration: valueDuration }) => {
      const shouldInterpolate = INTERPOLATE_PROPERTIES.includes(property)
      let value = null

      if (forceHoveredStyle) {
        value = new Animated.Value(shouldInterpolate ? 1 : (to as number))
        setIsHovered(true)
      } else {
        value = new Animated.Value(shouldInterpolate ? 0 : (from as number))
        setIsHovered(false)
      }

      return {
        value,
        property,
        from,
        to,
        duration: valueDuration || DURATIONS.FAST
      }
    })

    // Don't add it if it's already being animated
    if (opacity) return newValues

    // Opacity is always needed for onPressIn and onPressOut
    newValues.push({
      value: new Animated.Value(1),
      property: 'opacity',
      from: 1,
      to: 1,
      duration: DURATIONS.FAST
    })

    return newValues
  }, [memoizedValues, forceHoveredStyle])

  // Set initial animation
  useEffect(() => {
    if (!animatedValues) return

    animatedValues.forEach(({ property, value, from }: AnimationValuesExtended) => {
      const fromValue = !INTERPOLATE_PROPERTIES.includes(property) ? (from as number) : 0

      Animated.timing(value, {
        toValue: fromValue,
        duration: 0,
        useNativeDriver: true
      }).start()
    })
  }, [animatedValues])

  useEffect(() => {
    if (!animatedValues || !forceHoveredStyle) return

    animatedValues.forEach(
      ({ property, value, to, duration: valueDuration }: AnimationValuesExtended) => {
        const toValue = !INTERPOLATE_PROPERTIES.includes(property) ? (to as number) : 1
        value.stopAnimation()
        Animated.timing(value, { toValue, duration: valueDuration, useNativeDriver: true }).start()
      }
    )
  }, [forceHoveredStyle, animatedValues])

  // Bind the events
  const bind = useMemo(
    () => ({
      onHoverIn: () => {
        if (!animatedValues || forceHoveredStyle) return

        animatedValues.forEach(
          ({ property, value, to, duration: valueDuration }: AnimationValuesExtended) => {
            const toValue = !INTERPOLATE_PROPERTIES.includes(property) ? (to as number) : 1

            // Stop any ongoing animation to prevent overlap.
            // This ensures a clean transition and avoids conflicting animations
            // that could leave the value in an unpredictable state
            value.stopAnimation()
            Animated.timing(value, {
              toValue,
              duration: valueDuration,
              useNativeDriver: true
            }).start()
          }
        )
        // Defer state update to avoid interfering with hover event timing
        requestAnimationFrame(() => setIsHovered(false))
      },
      onHoverOut: () => {
        if (!animatedValues || forceHoveredStyle) return

        animatedValues.forEach(
          ({ property, value, from, duration: valueDuration }: AnimationValuesExtended) => {
            const toValue = !INTERPOLATE_PROPERTIES.includes(property) ? (from as number) : 0

            // Stop any ongoing animation to prevent overlap.
            // This ensures a clean transition and avoids conflicting animations
            // that could leave the value in an unpredictable state
            value.stopAnimation()
            Animated.timing(value, {
              toValue,
              duration: valueDuration,
              useNativeDriver: true
            }).start()
          }
        )
        // Defer state update to avoid interfering with hover event timing
        requestAnimationFrame(() => setIsHovered(false))
      },
      onPressIn: () => {
        const opacity = animatedValues.find(({ property }) => property === 'opacity')

        if (!opacity) return

        Animated.timing(opacity.value, {
          toValue: 0.7,
          duration: 0,
          useNativeDriver: true
        }).start()
      },
      // @TODO: Remove
      onPressOut: () => {}
    }),
    [animatedValues, forceHoveredStyle]
  )

  const style = useMemo(() => {
    if (animatedValues)
      return animatedValues?.reduce((acc, { property, value, from, to }) => {
        const shouldInterpolate = INTERPOLATE_PROPERTIES.includes(property)

        return {
          ...acc,
          [property]: shouldInterpolate
            ? value.interpolate({ inputRange: [0, 1], outputRange: [from as string, to as string] })
            : value
        }
      }, {})

    // Prevents the hook from returning an empty style object on the first render
    return memoizedValues.reduce((acc, { property, from }) => ({ ...acc, [property]: from }), {})
  }, [animatedValues, memoizedValues])

  const triggerHover = useCallback(() => {
    setIsHovered(true)
  }, [])

  return [bind, style, isHovered, triggerHover, animatedValues] as [
    {
      onHoverIn: (event: MouseEvent) => void
      onHoverOut: (event: MouseEvent) => void
      onPressIn: (event: GestureResponderEvent) => void
      onPressOut: (event: GestureResponderEvent) => void
    },
    ViewStyle,
    boolean,
    () => void,
    AnimationValuesExtended[] | null
  ]
}

export default useMultiHover
