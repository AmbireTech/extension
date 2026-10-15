import { MutableRefObject, Ref } from 'react'
import { Animated, FlatList, FlatListProps } from 'react-native'

import type { DashboardPageScroll } from '../DashboardPagesCarousel/context'

export interface CarouselListOptions {
  /** Kept pointing at the list, for scrolling it from JS. */
  listRef: MutableRefObject<FlatList | null>
  /** Provided by the carousel, with `pageScroll`. Without them the list is a plain one. */
  scrollY?: Animated.Value
  /** Provided by the carousel. Without it the list is a plain one. */
  pageScroll?: DashboardPageScroll
  /** Only the open page reports its scroll to the carousel. */
  isOpen: boolean
  /** The page's own scroll listener, for a list outside the carousel. */
  onScroll?: FlatListProps<any>['onScroll']
}

export interface CarouselList {
  ListComponent: typeof FlatList
  ref: Ref<FlatList>
  onScroll?: FlatListProps<any>['onScroll']
  /** Mobile only, so Android reports the momentum events the carousel listens for natively. */
  onMomentumScrollEnd?: FlatListProps<any>['onMomentumScrollEnd']
}

/**
 * The list a dashboard page renders. Inside the carousel the open one reports its scroll
 * twice from the same events: into `scrollY`, which draws the banners and the overview, and
 * to `pageScroll` - on the UI thread on mobile - which settles a partly collapsed overview
 * once a drag is let go of, or on web, once the scroll stops.
 */
declare const useCarouselList: (options: CarouselListOptions) => CarouselList
export default useCarouselList
