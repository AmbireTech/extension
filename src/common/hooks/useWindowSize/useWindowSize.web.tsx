import { useCallback, useEffect, useMemo, useState } from 'react'

import { breakpointsByWindowHeight, breakpointsByWindowWidth } from './breakpoints'
import { WindowSizeProps } from './types'

const useWindowSize = (): WindowSizeProps => {
  const [width, setWidth] = useState(window.innerWidth)
  const [height, setHeight] = useState(window.innerHeight)

  const updateWindowSize = useCallback(() => {
    setWidth(window.innerWidth)
    setHeight(window.innerHeight)
  }, [])

  useEffect(() => {
    updateWindowSize()

    window.addEventListener('resize', updateWindowSize)

    return () => {
      window.removeEventListener('resize', updateWindowSize)
    }
  }, [updateWindowSize])

  const maxWidthSize: WindowSizeProps['maxWidthSize'] = useCallback(
    (size) => {
      if (typeof size === 'number') {
        return size <= width
      }

      return breakpointsByWindowWidth[size] <= width
    },
    [width]
  )

  const minWidthSize: WindowSizeProps['minWidthSize'] = useCallback(
    (size) => {
      if (typeof size === 'number') {
        return size > width
      }

      return breakpointsByWindowWidth[size] > width
    },
    [width]
  )

  const minHeightSize: WindowSizeProps['minHeightSize'] = useCallback(
    (size) => {
      if (typeof size === 'number') {
        return size > height
      }

      return breakpointsByWindowHeight[size] > height
    },
    [height]
  )

  return useMemo(
    () => ({
      width,
      height,
      minWidthSize,
      maxWidthSize,
      minHeightSize
    }),
    [width, height, maxWidthSize, minWidthSize, minHeightSize]
  )
}

export default useWindowSize
