import { createContext } from 'react'
import { Animated } from 'react-native'

import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'

export interface DashboardPageHandle {
  /** Where the page rests. Read off the end of a gesture, never per frame. */
  getRestingOffset: () => number
  scrollToOffset: (offset: number) => void
}

export interface DashboardCarouselContextValue {
  /** Scroll offset of the page the user is on. Collapses the banners above the tabs row. */
  scrollY: Animated.Value
  /** Height of the overlaid header, which the pages must be padded by to start below it. */
  headerHeight: number
  /**
   * Bumped when a swipe starts, so every page is back at the top by the time the
   * swipe lands and the shared header doesn't have to jump to match a new page.
   */
  resetToken: number
  /**
   * The header is laid over the pages, so a drag on it never reaches the list below.
   * A registered page can be scrolled by the header instead, which is what makes the
   * dashboard usable when there are enough banners to cover a page whole.
   */
  registerPage: (tab: TabType, handle: DashboardPageHandle | null) => void
}

/** Provided by the mobile carousel only, so the pages keep their own header elsewhere. */
const DashboardCarouselContext = createContext<DashboardCarouselContextValue | null>(null)

export default DashboardCarouselContext
