import { createContext } from 'react'
import { Animated, NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { NativeGesture } from 'react-native-gesture-handler'

import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'

import type { FloatingBottomBarProps } from '../FloatingBottomBar/FloatingBottomBar'

/** Whether the bar is hidden is the carousel's to decide, not the page's. */
export type DashboardFloatingBarProps = Omit<FloatingBottomBarProps, 'isHidden'>

export interface DashboardPageHandle {
  scrollToOffset: (offset: number) => void
  /**
   * The page's own scrolling, as something the carousel's pull can be declared against.
   * A scrollable page claims a drag before the pull can judge it, and a relation can
   * only be built between gestures - a plain list ref is silently dropped.
   */
  listGesture: NativeGesture
}

export interface DashboardCarouselContextValue {
  /** Scroll offset of the page the user is on. Collapses the banners above the tabs row. */
  scrollY: Animated.Value
  /** Height of the overlaid header, which the pages must be padded by to start below it. */
  headerHeight: number
  /**
   * How much of the header collapses away. Every page has to be able to scroll at
   * least this far, or it cannot put the header in the state the others left it in.
   */
  collapsibleHeight: number
  /**
   * How far the open overview pushes the pages down. They are never resized for it, so a
   * page whose end it hides must be able to scroll this far to collapse it.
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
   * Where a page has got to. Only the page being dragged knows whether there is
   * anything above it to scroll back to, and the pull has to know that before it can
   * tell a drag from the page being scrolled.
   */
  reportScrollOffset: (offset: number) => void
  /**
   * The open page's scroll, which collapses the overview and hides the floating bar.
   * `contentHeight` leaves out the room a page is given only to collapse the banners.
   */
  onPageScroll: (event: NativeSyntheticEvent<NativeScrollEvent>, contentHeight: number) => void
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
