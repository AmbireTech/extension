export interface PageMeasurements {
  /** The content's height without the footer that stretches it to its min height. */
  contentHeight: number
  /** The bottom padding of the content, below its last item. */
  paddingBottom: number
  /** The height of the list itself. */
  listHeight: number
  /** The content's min height, which lets every page scroll the banners out of view. */
  minContentHeight: number
  /** How far the open overview pushes the page down. 0 until it is measured. */
  overviewHeight: number
  /** How far up from the bottom the floating bar covers the page. 0 if it has none. */
  barReach: number
}

export interface CollapseThreshold {
  /** Extra scroll room for a page that otherwise can't scroll far enough to collapse. */
  collapseRoom: number
  /** How far the page has to be scrolled to collapse the overview. Infinity if it never does. */
  collapseThreshold: number
}

// Android reports offsets in whole pixels, which can round down short of 1px
const MIN_SCROLL_RANGE = 2

/**
 * Where a mobile dashboard page collapses the overview. The pages are pushed down by the open
 * overview rather than resized, so a page whose end that hides must scroll far enough to collapse it.
 */
const getCollapseThreshold = ({
  contentHeight,
  paddingBottom,
  listHeight,
  minContentHeight,
  overviewHeight,
  barReach
}: PageMeasurements): CollapseThreshold => {
  // How far the page scrolls anyway, e.g. to collapse the banners
  const baseScrollRange = Math.max(minContentHeight, contentHeight, listHeight) - listHeight
  const itemsEnd = contentHeight - paddingBottom
  // Whether the last item stays hidden under the open overview or the bar, which only hides
  // with the overview, even with the page scrolled as far as it goes
  const isEndHidden =
    !!overviewHeight && itemsEnd - baseScrollRange > listHeight - overviewHeight - barReach

  // A page whose end shows without collapsing never collapses it
  if (!isEndHidden) return { collapseRoom: 0, collapseThreshold: Infinity }

  // Collapsing shows the end and hides the bar, so a page only needs to be able to scroll at all
  const collapseRoom = Math.max(listHeight + MIN_SCROLL_RANGE - contentHeight, 0)
  const scrollRange = Math.max(baseScrollRange, contentHeight + collapseRoom - listHeight)

  // Collapses at the overview's height, or at the end of a page that can't scroll that far
  return { collapseRoom, collapseThreshold: Math.min(overviewHeight, scrollRange - 1) }
}

export default getCollapseThreshold
