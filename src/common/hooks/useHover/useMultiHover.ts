import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, ColorValue, GestureResponderEvent, MouseEvent, ViewStyle } from 'react-native'

import { isWeb } from '@common/config/env'
import useDeepMemo from '@common/hooks/useDeepMemo'
import usePrevious from '@common/hooks/usePrevious'
import { getUiType } from '@common/utils/uiType'

import DURATIONS from './durations'

export type AnimationValues = {
  property: keyof ViewStyle | string
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

const PRESSED_OPACITY = 0.7

const useMultiHover = ({ values, forceHoveredStyle = false }: Props) => {
  // Deep memoize the values to prevent unnecessary re-renders
  const memoizedValues = useDeepMemo(values)
  // Used to avoid running the initial animation more than once
  const isInitialAnimationDone = useRef(false)
  const prevForceHoveredStyle = usePrevious(forceHoveredStyle)
  const [isHovered, setIsHovered] = useState(false)

  // Nothing hovers on the mobile app: `animate` returns early there, so the press
  // opacity is the only channel that ever moves. One Animated.Value instead of one
  // per property - plus an interpolation node per color - is what every
  // interactive element in the app would otherwise pay at mount, for nothing.
  const isMobileApp = getUiType().isMobileApp

  // Initialize the values that will be animated
  const animatedValues = useMemo(() => {
    const opacity = memoizedValues.find(({ property }) => property === 'opacity')

    if (isMobileApp)
      return [
        {
          value: new Animated.Value((opacity?.from as number) ?? 1),
          property: 'opacity',
          from: opacity?.from ?? 1,
          to: opacity?.to ?? 1,
          duration: DURATIONS.FAST
        }
      ]

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
  }, [isMobileApp, memoizedValues])

  const animate = useCallback(
    (reversed?: boolean, customDuration?: number, skipStateUpdate?: boolean) => {
      if (getUiType().isMobileApp) return
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
    if (getUiType().isMobileApp) return
    if (!animatedValues || !!isInitialAnimationDone.current || forceHoveredStyle) return

    // 0 for an immediate animation
    animate(true, 0, true)
    isInitialAnimationDone.current = true
  }, [animate, animatedValues, forceHoveredStyle])

  // forceHoveredStyle handling
  useEffect(() => {
    if (getUiType().isMobileApp) return
    if (isHovered) return

    // Animate to hovered state
    if (forceHoveredStyle && !prevForceHoveredStyle) {
      animate(false, undefined, true)
    } else if (!forceHoveredStyle && prevForceHoveredStyle) {
      // Animate back to the initial state immediately
      animate(true, 0, true)
    }
  }, [forceHoveredStyle, animate, prevForceHoveredStyle, isHovered])

  // Set instead of animate, because a native driven animation stops reaching the
  // view once a re-render detaches its animated node, leaving the press feedback stuck.
  const setPressOpacity = useCallback(
    (value: number) => {
      const opacity = animatedValues.find(({ property }) => property === 'opacity')

      if (!opacity) return

      opacity.value.setValue(value)
    },
    [animatedValues]
  )

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
        setPressOpacity(PRESSED_OPACITY)
      },
      onPressOut: (_event?: GestureResponderEvent) => {
        setPressOpacity(1)
      }
    }),
    [animate, setPressOpacity, forceHoveredStyle, onHoverIn]
  )

  const style = useMemo(() => {
    // The hovered style is never reached on the mobile app, so the properties
    // stay at the value they start from - only the opacity has to stay animated.
    if (isMobileApp) {
      const staticStyle = memoizedValues.reduce(
        (acc, { property, from }) => ({ ...acc, [property]: from }),
        {}
      )

      return { ...staticStyle, opacity: animatedValues[0]?.value }
    }

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
  }, [animatedValues, isMobileApp, memoizedValues])

  return [bind, style, isHovered || forceHoveredStyle, onHoverIn, animatedValues] as [
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
