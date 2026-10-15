import React, { ReactNode } from 'react'
import { Animated } from 'react-native'

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
  /**
   * How far the open overview pushes the pager down. The pager slides over the collapsing
   * part of the overview while the open page is scrolled down.
   */
  overviewHeight?: number
  /**
   * Hands out how far the overview is collapsed, from 0 to `overviewHeight`, as the native
   * animated value the pager is moved by, so the overview can move its background in step.
   */
  onOverviewCollapseChange?: (collapse: Animated.AnimatedInterpolation<number>) => void
  children: ReactNode
}

declare const DashboardPagesCarousel: React.FC<DashboardPagesCarouselProps>
export default DashboardPagesCarousel
