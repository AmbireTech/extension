export interface CollapseState {
  lastOffsetY: number
  /** Where the current scroll up began, 0 while scrolling down. */
  scrollUpStartedAt: number
  isOverviewCollapsed: boolean
}

export interface ScrollSample {
  offsetY: number
  contentHeight: number
  layoutHeight: number
  /**
   * The user has to scroll down the height of the overview container in order make it smaller.
   * This is done, because hiding the overview will subtract the height of the overview from the
   * height of the scroll view, thus a shorter scroll container may no longer be scrollable after
   * hiding the overview and if that happens, the user will not be able to scroll up to expand it.
   */
  scrollDownThreshold: number
  /** How much taller the list gets once the overview collapses. */
  collapsibleHeight: number
}

export const INITIAL_COLLAPSE_STATE: CollapseState = {
  lastOffsetY: 0,
  scrollUpStartedAt: 0,
  isOverviewCollapsed: false
}

// Must be a constant value and not dependent on the height of the overview,
// because the height will change as the overview animates from small to large.
const SCROLL_UP_THRESHOLD = 200
const FLOATING_BAR_HIDE_OFFSET = 50

const isPastScrollUp = (offsetY: number, scrollUpStartedAt: number) =>
  offsetY > scrollUpStartedAt - SCROLL_UP_THRESHOLD

/** Web hides the floating bar sooner than it collapses the overview, mobile hides it with it. */
export const getIsFloatingBarHidden = ({ lastOffsetY, scrollUpStartedAt }: CollapseState) =>
  lastOffsetY > FLOATING_BAR_HIDE_OFFSET && isPastScrollUp(lastOffsetY, scrollUpStartedAt)

/**
 * Collapses the dashboard overview while the list is scrolled down, and brings it back once
 * it is scrolled up far enough.
 */
const getNextCollapseState = (prev: CollapseState, sample: ScrollSample): CollapseState => {
  const { offsetY, contentHeight, layoutHeight, scrollDownThreshold, collapsibleHeight } = sample

  let { scrollUpStartedAt } = prev

  if (scrollUpStartedAt === 0 && prev.lastOffsetY > offsetY) {
    scrollUpStartedAt = offsetY
  } else if (scrollUpStartedAt > 0 && offsetY > prev.lastOffsetY) {
    scrollUpStartedAt = 0
  }

  const isScrolledPastOverview =
    offsetY >= scrollDownThreshold && isPastScrollUp(offsetY, scrollUpStartedAt)
  // Only checked before collapsing: the list loses `collapsibleHeight` of scroll room once
  // collapsed, and it must still be able to stay past the threshold, or it would flicker.
  const canStayCollapsed = contentHeight - layoutHeight >= scrollDownThreshold + collapsibleHeight

  return {
    lastOffsetY: offsetY,
    scrollUpStartedAt,
    isOverviewCollapsed: isScrolledPastOverview && (prev.isOverviewCollapsed || canStayCollapsed)
  }
}

export default getNextCollapseState
