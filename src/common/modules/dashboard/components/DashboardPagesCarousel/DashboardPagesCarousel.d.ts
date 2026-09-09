import React, { ReactNode } from 'react'

import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'

export interface DashboardPagesCarouselProps {
  openTab: TabType
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  sessionId: string
  /**
   * Called once on mount by the platforms that keep every page swipeable, so the
   * pages the user hasn't opened yet are populated before they are swiped into view.
   */
  initAllTabs: () => void
  /** Pulling the header down past the top refreshes, as pulling a page down does. */
  onRefresh?: () => void
  /** Holds the pages open on the spinner for as long as the refresh runs. */
  refreshing?: boolean
  children: ReactNode
}

declare const DashboardPagesCarousel: React.FC<DashboardPagesCarouselProps>
export default DashboardPagesCarousel
