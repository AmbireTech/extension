import { useCallback, useEffect, useMemo, useState } from 'react'

import { getUiType } from '@common/utils/uiType'
import { SIDE_PANEL_MIN_WIDTH } from '@web/constants/spacings'

import { breakpointsByWindowHeight, breakpointsByWindowWidth } from './breakpoints'
import { WindowSizeProps } from './types'

const { isSidePanel } = getUiType()

// A Firefox sidebar can be narrower than the layout supports; the content is then kept at
// SIDE_PANEL_MIN_WIDTH by side-panel.html, so the layout must be computed for that width too.
const getViewportWidth = () =>
  isSidePanel
    ? Math.max(document.documentElement.clientWidth, SIDE_PANEL_MIN_WIDTH)
    : window.innerWidth

const getViewportHeight = () =>
  isSidePanel ? document.documentElement.clientHeight : window.innerHeight

const useWindowSize = (): WindowSizeProps => {
  const [width, setWidth] = useState(getViewportWidth)
  const [height, setHeight] = useState(getViewportHeight)

  const updateWindowSize = useCallback(() => {
    setWidth(getViewportWidth())
    setHeight(getViewportHeight())
  }, [])

  useEffect(() => {
    updateWindowSize()

    window.addEventListener('resize', updateWindowSize)

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateWindowSize) : undefined

    resizeObserver?.observe(document.documentElement)

    return () => {
      window.removeEventListener('resize', updateWindowSize)
      resizeObserver?.disconnect()
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
