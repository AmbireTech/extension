import { useCallback, useMemo, useSyncExternalStore } from 'react'

import { getUiType } from '@common/utils/uiType'

import { breakpointsByWindowHeight, breakpointsByWindowWidth } from './breakpoints'
import { WindowSizeProps } from './types'

const { isSidePanel } = getUiType()

const getViewportWidth = () =>
  isSidePanel ? document.documentElement.clientWidth : window.innerWidth

const getViewportHeight = () =>
  isSidePanel ? document.documentElement.clientHeight : window.innerHeight

type Viewport = { width: number; height: number }

/**
 * One observer and one resize listener for the whole app, rather than a pair per caller.
 * The hook is reached from deep inside row-level components, so on a screen with a long
 * list every row used to install its own - and every resize then fanned out to one state
 * update per row.
 */
let viewport: Viewport | null = null
const listeners = new Set<() => void>()
let stopObserving: (() => void) | null = null

const readViewport = () => {
  const width = getViewportWidth()
  const height = getViewportHeight()

  // The snapshot has to keep its identity while the size does not change, otherwise
  // every subscriber re-renders on every event
  if (viewport && viewport.width === width && viewport.height === height) return

  viewport = { width, height }
  listeners.forEach((listener) => listener())
}

const getSnapshot = (): Viewport => {
  if (!viewport) viewport = { width: getViewportWidth(), height: getViewportHeight() }

  return viewport
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)

  if (listeners.size === 1) {
    // The viewport may have changed between the first render and this subscription
    readViewport()

    window.addEventListener('resize', readViewport)
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(readViewport) : undefined
    resizeObserver?.observe(document.documentElement)

    stopObserving = () => {
      window.removeEventListener('resize', readViewport)
      resizeObserver?.disconnect()
    }
  }

  return () => {
    listeners.delete(listener)

    if (listeners.size) return

    stopObserving?.()
    stopObserving = null
  }
}

const useWindowSize = (): WindowSizeProps => {
  const { width, height } = useSyncExternalStore(subscribe, getSnapshot)

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
