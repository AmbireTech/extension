export interface OverviewCollapse {
  lastOffsetY: number
  /**
   * How far the page has been scrolled down, less how far back up, kept between 0 and
   * `OVERVIEW_RETURN_DISTANCE` plus the overview's height. Scrolling up takes it down
   * through the return distance before the overview starts expanding.
   */
  returnDistance: number
  /** How much of the overview is collapsed, from 0 to its height. */
  collapsed: number
}

export interface OverviewCollapseLayout {
  /** How far the banners scroll before the overview starts collapsing. */
  bannersHeight: number
  /** How much of the overview collapses. */
  overviewHeight: number
}

/** How far a page has to be scrolled up before the overview starts expanding mid-page. */
export const OVERVIEW_RETURN_DISTANCE = 100

export const INITIAL_OVERVIEW_COLLAPSE: OverviewCollapse = {
  lastOffsetY: 0,
  returnDistance: 0,
  collapsed: 0
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/**
 * Mirrors the mobile overview's collapse, which the carousel works out on the UI thread from
 * the open page's offset: it follows the page's scroll once past the banners, and expands
 * again with any scroll up longer than `OVERVIEW_RETURN_DISTANCE`, wherever the page is.
 */
const getNextOverviewCollapse = (
  prev: OverviewCollapse,
  offsetY: number,
  { bannersHeight, overviewHeight }: OverviewCollapseLayout
): OverviewCollapse => {
  const returnDistance = clamp(
    prev.returnDistance + offsetY - prev.lastOffsetY,
    0,
    OVERVIEW_RETURN_DISTANCE + overviewHeight
  )
  // Never more than the page is scrolled past the banners, so near the top the items
  // stay right below the tabs
  const collapsedByOffset = clamp(offsetY - bannersHeight, 0, overviewHeight)

  return {
    lastOffsetY: offsetY,
    returnDistance,
    collapsed: Math.min(collapsedByOffset, returnDistance, overviewHeight)
  }
}

export default getNextOverviewCollapse
