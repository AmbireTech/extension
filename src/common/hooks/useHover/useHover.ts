import { Animated, Pressable, Text, ViewStyle } from 'react-native'

import useCustomHover from './useCustomHover'

export const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export const AnimatedText = Animated.createAnimatedComponent(Text)

type Preset = 'opacity' | 'opacityInverted'

type Presets = {
  [key in Preset]: {
    property: keyof ViewStyle
    from: number
    to: number
  }
}

const presets: Presets = {
  opacity: {
    property: 'opacity',
    from: 0.7,
    to: 1
  },
  opacityInverted: {
    property: 'opacity',
    from: 1,
    to: 0.7
  }
}

interface Props {
  preset: Preset
  duration?: number
  forceHoveredStyle?: boolean
}

const useHover = ({ preset, duration, forceHoveredStyle }: Props) => {
  return useCustomHover({
    property: presets[preset].property,
    values: presets[preset],
    duration,
    forceHoveredStyle
  })
}

export default useHover
