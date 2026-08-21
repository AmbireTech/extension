import { createContext } from 'react'
import { Animated } from 'react-native'

import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'

export interface DashboardPageHandle {
  scrollToOffset: (offset: number) => void
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
  /** Height of a page, which its content has to exceed to be scrollable at all. */
  pageHeight: number
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
