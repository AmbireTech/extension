export interface PageMeasurements {
  /**
   * The content's height without the footer that stretches it to its min height. Includes
   * the top padding for the banners and the open overview.
   */
  contentHeight: number
  /** The bottom padding of the content, below its last item. */
  paddingBottom: number
  /** The height of the list itself. */
  listHeight: number
  /** The content's min height, which lets every page scroll the banners out of view. */
  minContentHeight: number
  /** How far the banners scroll before the overview starts collapsing. */
  bannersHeight: number
  /** How much of the overview collapses. 0 until it is measured. */
  overviewHeight: number
  /** How far up from the bottom the floating bar covers the page. 0 if it has none. */
  barReach: number
}

/**
 * Whether a mobile dashboard page gets the room to scroll the overview collapsed. Only one
 * whose end stays hidden does: under the open overview, or under the floating bar, which only
 * hides with the overview. A page whose end shows doesn't scroll past the banners at all.
 */
const getCanCollapseOverview = ({
  contentHeight,
  paddingBottom,
  listHeight,
  minContentHeight,
  bannersHeight,
  overviewHeight,
  barReach
}: PageMeasurements): boolean => {
  if (!overviewHeight) return false

  // How far the page scrolls anyway, e.g. to collapse the banners
  const baseScrollRange = Math.max(minContentHeight, contentHeight) - listHeight
  // Its items don't fit below the open overview, so scrolling them would collapse it partly
  if (baseScrollRange > bannersHeight) return true

  const itemsEnd = contentHeight - paddingBottom

  return itemsEnd - baseScrollRange > listHeight - barReach
}

export default getCanCollapseOverview
