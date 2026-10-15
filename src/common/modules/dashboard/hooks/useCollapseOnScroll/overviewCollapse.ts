/** How far a page has to be scrolled up before the overview starts expanding mid-page. */
export const OVERVIEW_RETURN_DISTANCE = 100

const clamp = (value: number, min: number, max: number) => {
  'worklet'

  return Math.min(Math.max(value, min), max)
}

/**
 * How far the page has been scrolled down, less how far back up, kept between 0 and
 * `OVERVIEW_RETURN_DISTANCE` plus the overview's height. Scrolling up takes it down through
 * the return distance before the overview starts expanding, wherever the page is.
 */
export const getNextReturnDistance = (
  returnDistance: number,
  scrolledBy: number,
  overviewHeight: number
) => {
  'worklet'

  return clamp(returnDistance + scrolledBy, 0, OVERVIEW_RETURN_DISTANCE + overviewHeight)
}

/**
 * How much of the mobile overview is collapsed, from 0 to its height. It follows the page's
 * scroll once past the banners, and expands again with any scroll up longer than
 * `OVERVIEW_RETURN_DISTANCE`.
 */
export const getOverviewCollapsed = (
  offsetY: number,
  returnDistance: number,
  bannersHeight: number,
  overviewHeight: number
) => {
  'worklet'

  // Never more than the page is scrolled past the banners, so near the top the items
  // stay right below the tabs
  const collapsedByOffset = clamp(offsetY - bannersHeight, 0, overviewHeight)

  return Math.min(collapsedByOffset, returnDistance, overviewHeight)
}

/**
 * Where to scroll the page to, to take a partly collapsed overview fully open or collapsed,
 * whichever is closer. Scrolling moves the collapse by as much, whether it follows the offset
 * or the return distance. `null` if it is already fully open or collapsed.
 */
export const getSettleOffset = (offsetY: number, collapsed: number, overviewHeight: number) => {
  'worklet'

  // A pixel of tolerance, as Android reports offsets rounded
  if (collapsed < 1 || collapsed > overviewHeight - 1) return null

  return collapsed > overviewHeight / 2 ? offsetY + overviewHeight - collapsed : offsetY - collapsed
}
