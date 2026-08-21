import { createContext } from 'react'
import { Animated } from 'react-native'

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
}

/** Provided by the mobile carousel only, so the pages keep their own header elsewhere. */
const DashboardCarouselContext = createContext<DashboardCarouselContextValue | null>(null)

export default DashboardCarouselContext
