import { ColorValue, ViewStyle } from 'react-native'

import useMultiHover from './useMultiHover'

interface Props {
  property: keyof ViewStyle
  values: {
    from: number | ColorValue
    to: number | ColorValue
  }
  duration?: number
  forceHoveredStyle?: boolean
}

const useCustomHover = ({ property, values, duration, forceHoveredStyle }: Props) => {
  return useMultiHover({
    values: [{ property, ...values, duration }],
    forceHoveredStyle
  })
}

export default useCustomHover
