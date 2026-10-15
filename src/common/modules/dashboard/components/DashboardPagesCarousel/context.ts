import { createContext } from 'react'
import { Animated } from 'react-native'
import { NativeGesture } from 'react-native-gesture-handler'

import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'

import type { FloatingBottomBarProps } from '../FloatingBottomBar/FloatingBottomBar'

/** Whether the bar is hidden is the carousel's to decide, not the page's. */
export type DashboardFloatingBarProps = Omit<FloatingBottomBarProps, 'isHidden'>

export interface DashboardPageHandle {
  scrollToOffset: (offset: number, animated?: boolean) => void
  /**
   * The page's own scrolling, as something the carousel's pull can be declared against.
   * A scrollable page claims a drag before the pull can judge it, and a relation can
   * only be built between gestures - a plain list ref is silently dropped.
   */
  listGesture: NativeGesture
}

/**
 * Worklets the open page calls from its scroll handler, on the UI thread. They keep the same
 * state `scrollY` draws by, from the same native events, to settle a drag by - so what is
 * drawn and what a drag is settled by can never disagree.
 */
export interface DashboardPageScroll {
  /** Every scroll event of the open page, on the UI thread. */
  onScroll: (offsetY: number) => void
  /** The open page's drag starting, during which the overview is never settled. */
  onBeginDrag: () => void
  /** The open page's drag ending. Returns where to scroll it to settle the overview, if anywhere. */
  onEndDrag: (velocityY: number) => number | null
  /** The open page's momentum ending. Returns where to scroll it to settle the overview, if anywhere. */
  onMomentumEnd: () => number | null
}

export interface DashboardCarouselContextValue {
  /**
   * Scroll offset of the open page, mapped natively. Collapses the banners and the overview
   * through native animated nodes, which update the views directly.
   */
  scrollY: Animated.Value
  /** What the open page also reports its scroll to, on the UI thread. */
  pageScroll: DashboardPageScroll
  /** Height of the overlaid header, which the pages must be padded by to start below it. */
  headerHeight: number
  /**
   * How much of the header collapses away. Every page has to be able to scroll at
   * least this far, or it cannot put the header in the state the others left it in.
   */
  collapsibleHeight: number
  /**
   * How much of the overview collapses. It collapses as the page is scrolled past the
   * banners, so every page is padded by it, and one whose end it hides has to be able to
   * scroll this much further.
   */
  overviewHeight: number
  /** Height of a page, which its content has to exceed to be scrollable at all. */
  pageHeight: number
  /**
   * The header is laid over the pages, so a drag on it never reaches the list below.
   * A registered page can be scrolled by the header instead, which is what makes the
   * dashboard usable when there are enough banners to cover a page whole.
   */
  registerPage: (tab: TabType, handle: DashboardPageHandle | null) => void
  /**
   * The bar belongs to the dashboard rather than to a page, so it is rendered above
   * the pager and stays put through a swipe. A page registers what it wants in it,
   * and the tab that is open decides whose registration is shown.
   */
  registerFloatingBar: (tab: TabType, bar: DashboardFloatingBarProps | null) => void
}

/** Provided by the mobile carousel only, so the pages keep their own header elsewhere. */
const DashboardCarouselContext = createContext<DashboardCarouselContextValue | null>(null)

export default DashboardCarouselContext
