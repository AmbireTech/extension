import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, ColorValue, GestureResponderEvent, MouseEvent, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import useDeepMemo from '@common/hooks/useDeepMemo'
import usePrevious from '@common/hooks/usePrevious'

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
  // Deep memoize the values to prevent unnecessary re-renders
  const memoizedValues = useDeepMemo(values)
  // Used to avoid running the initial animation more than once
  const isInitialAnimationDone = useRef(false)
  const prevForceHoveredStyle = usePrevious(forceHoveredStyle)
  const [isHovered, setIsHovered] = useState(false)

  // Initialize the values that will be animated
  const animatedValues = useMemo(() => {
    const opacity = memoizedValues.find(({ property }) => property === 'opacity')

    const newValues = memoizedValues.map(({ property, from, to, duration: valueDuration }) => {
      const shouldInterpolate = INTERPOLATE_PROPERTIES.includes(property)
      let value = null

      value = new Animated.Value(shouldInterpolate ? 0 : (from as number))

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

    // Opacity is always needed for onPressIn
    newValues.push({
      value: new Animated.Value(1),
      property: 'opacity',
      from: 1,
      to: 1,
      duration: DURATIONS.FAST
    })

    return newValues
  }, [memoizedValues])

  const animate = useCallback(
    (reversed?: boolean, customDuration?: number, skipStateUpdate?: boolean) => {
      if (!animatedValues) return

      // Animate all values in parallel
      animatedValues.forEach(
        ({ property, value, to, from, duration: valueDuration }: AnimationValuesExtended) => {
          let toValue = !INTERPOLATE_PROPERTIES.includes(property) ? (to as number) : 1

          if (reversed) toValue = !INTERPOLATE_PROPERTIES.includes(property) ? (from as number) : 0

          Animated.timing(value, {
            toValue,
            duration: customDuration ?? valueDuration,
            useNativeDriver: !isWeb
          }).start()
        }
      )
      if (!skipStateUpdate) {
        requestAnimationFrame(() => {
          setIsHovered(!reversed)
        })
      }
    },
    [animatedValues]
  )

  // Set initial animation
  useEffect(() => {
    if (!animatedValues || !!isInitialAnimationDone.current || forceHoveredStyle) return

    // 0 for an immediate animation
    animate(true, 0, true)
    isInitialAnimationDone.current = true
  }, [animate, animatedValues, forceHoveredStyle])

  // forceHoveredStyle handling
  useEffect(() => {
    if (isHovered) return

    // Animate to hovered state
    if (forceHoveredStyle && !prevForceHoveredStyle) {
      animate(false, undefined, true)
    } else if (!forceHoveredStyle && prevForceHoveredStyle) {
      // Animate back to the initial state immediately
      animate(true, 0, true)
    }
  }, [forceHoveredStyle, animate, prevForceHoveredStyle, isHovered])

  const onHoverIn = useCallback(() => {
    // Don't animate if forceHoveredStyle because that's handled in a useEffect
    if (forceHoveredStyle) return

    animate()
  }, [animate, forceHoveredStyle])

  // Bind the events
  const bind = useMemo(
    () => ({
      onHoverIn,
      onHoverOut: () => {
        // Don't animate if forceHoveredStyle because that's handled in a useEffect
        if (forceHoveredStyle) return

        animate(true)
      },
      onPressIn: () => {
        const opacity = animatedValues.find(({ property }) => property === 'opacity')

        if (!opacity) return

        Animated.timing(opacity.value, {
          toValue: 0.7,
          duration: 0,
          useNativeDriver: true
        }).start()
      }
    }),
    [animate, animatedValues, forceHoveredStyle, onHoverIn]
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

  return [bind, style, isHovered || forceHoveredStyle, onHoverIn, animatedValues] as [
    {
      onHoverIn: (event: MouseEvent) => void
      onHoverOut: (event: MouseEvent) => void
      onPressIn: (event: GestureResponderEvent) => void
    },
    ViewStyle,
    boolean,
    () => void,
    AnimationValuesExtended[] | null
  ]
}

export default useMultiHover
