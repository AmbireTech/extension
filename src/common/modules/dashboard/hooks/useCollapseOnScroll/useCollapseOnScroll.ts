import { useCallback, useEffect, useRef, useState } from 'react'
import { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'

import getNextCollapseState, {
  getIsFloatingBarHidden,
  INITIAL_COLLAPSE_STATE
} from './getNextCollapseState'

/**
 * Tracks the scroll direction of the open dashboard page. Re-renders only when the overview
 * collapses or expands, or the floating bar hides or shows, not on every scroll event.
 * `collapsibleHeight` is how much taller the list gets once collapsed (0 if it doesn't).
 */
const useCollapseOnScroll = (overviewHeight: number, collapsibleHeight: number) => {
  const stateRef = useRef(INITIAL_COLLAPSE_STATE)
  // Read through a ref, so the overview animating its height doesn't change `onScroll`
  // and re-render every page it is passed to
  const overviewHeightRef = useRef(overviewHeight)
  const collapsibleHeightRef = useRef(collapsibleHeight)

  useEffect(() => {
    overviewHeightRef.current = overviewHeight
    collapsibleHeightRef.current = collapsibleHeight
  }, [collapsibleHeight, overviewHeight])

  const [isOverviewCollapsed, setIsOverviewCollapsed] = useState(false)
  const [isFloatingBarHidden, setIsFloatingBarHidden] = useState(false)

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
    const next = getNextCollapseState(stateRef.current, {
      offsetY: contentOffset.y,
      contentHeight: contentSize.height,
      layoutHeight: layoutMeasurement.height,
      scrollDownThreshold: overviewHeightRef.current,
      collapsibleHeight: collapsibleHeightRef.current
    })

    stateRef.current = next
    setIsOverviewCollapsed(next.isOverviewCollapsed)
    setIsFloatingBarHidden(getIsFloatingBarHidden(next))
  }, [])

  /** Expands the overview and shows the bar, e.g. when another page is opened. */
  const reset = useCallback(() => {
    stateRef.current = INITIAL_COLLAPSE_STATE
    setIsOverviewCollapsed(false)
    setIsFloatingBarHidden(false)
  }, [])

  return { isOverviewCollapsed, isFloatingBarHidden, onScroll, reset }
}

export default useCollapseOnScroll
