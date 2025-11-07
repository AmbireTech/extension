import { useMemo } from 'react'

import useWindowSize from '@common/hooks/useWindowSize'

type Props = {
  maxBreakpoints?: number
}

const useResponsiveActionWindow = ({ maxBreakpoints }: Props = {}) => {
  const { minHeightSize } = useWindowSize()

  const breakpoints = useMemo(() => {
    return [
      [minHeightSize(600), 0.8],
      [minHeightSize(650), 0.85],
      [minHeightSize(700), 0.9],
      [minHeightSize(750), 0.95]
    ]
  }, [minHeightSize])

  const limitedBreakpoints = useMemo(() => {
    if (maxBreakpoints && breakpoints.length > maxBreakpoints && maxBreakpoints > 0) {
      return breakpoints.slice(-maxBreakpoints)
    }
    return breakpoints
  }, [breakpoints, maxBreakpoints])

  const responsiveSizeMultiplier = useMemo(() => {
    let multiplier = 1

    limitedBreakpoints.reverse().forEach(([condition, value]) => {
      if (condition) {
        multiplier = value as number
      }
    })

    return multiplier
  }, [limitedBreakpoints])

  return { responsiveSizeMultiplier }
}

export default useResponsiveActionWindow
