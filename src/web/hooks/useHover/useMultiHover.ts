import { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, ViewStyle } from 'react-native'

import DURATIONS from './durations'

type AnimationValues = {
  key: keyof ViewStyle
  from: number
  to: number
  duration?: number
}

type AnimationValuesExtended = AnimationValues & {
  value: Animated.Value
}

interface Props {
  values: AnimationValues[]
  duration?: number
}

const useMultiHover = ({ values, duration = DURATIONS.REGULAR }: Props) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const animatedValuesRef = useRef<AnimationValuesExtended[] | null>(null)
  const animatedValues = animatedValuesRef.current

  useEffect(() => {
    const opacity = values.find(({ key }) => key === 'opacity')
    animatedValuesRef.current = values.map(({ key, from, to, duration: valueDuration }) => ({
      value: new Animated.Value(from),
      key,
      from,
      to,
      duration: valueDuration
    }))

    if (opacity) return

    animatedValuesRef.current.push({
      value: new Animated.Value(1),
      key: 'opacity',
      from: 1,
      to: 1,
      duration
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values?.length])

  useEffect(() => {
    if (!animatedValues) return

    animatedValues.forEach(
      ({ value, from, to, duration: valueDuration }: AnimationValuesExtended) => {
        Animated.timing(value, {
          toValue: isHovered ? to : from,
          duration: valueDuration || duration,
          useNativeDriver: true
        }).start()
      }
    )

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovered])

  useEffect(() => {
    if (!animatedValues) return

    const opacity = animatedValues.find(({ key }) => key === 'opacity')

    if (!opacity) return

    Animated.timing(opacity.value, {
      toValue: isPressed ? 0.7 : 1,
      duration: 0,
      useNativeDriver: true
    }).start()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPressed])

  const bind = useMemo(
    () => ({
      onHoverIn: () => {
        setIsHovered(true)
      },
      onHoverOut: () => {
        setIsHovered(false)
      },
      onPressIn: () => {
        setIsPressed(true)
      },
      onPressOut: () => {
        setIsPressed(false)
      }
    }),
    []
  )

  const style = useMemo(() => {
    if (animatedValues)
      return animatedValues?.reduce(
        (acc, { key, value }) => ({
          ...acc,
          [key]: value
        }),
        {}
      )

    // Prevents the hook from returning an empty style object on the first render
    return values.reduce(
      (acc, { key, from }) => ({
        ...acc,
        [key]: from
      }),
      {}
    )
  }, [animatedValues, values])

  return [bind, style, isHovered] as [
    {
      onHoverIn: () => void
      onHoverOut: () => void
      onPressIn: () => void
      onPressOut: () => void
    },
    ViewStyle,
    boolean
  ]
}

export default useMultiHover
