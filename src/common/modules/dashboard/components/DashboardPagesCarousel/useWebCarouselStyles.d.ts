import type { ViewStyle } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'

export interface WebCarouselStylesOptions {
  /** Scroll offset of the open page, kept in step with its scroll events. */
  scrollOffset: SharedValue<number>
  bannersHeight: number
  overviewHeight: number
  /** Whether there is an overview to collapse at all, so the pages wait for it to be measured. */
  hasOverview: boolean
  /** How far the floating bar moves to be fully hidden. */
  floatingBarHideDistance: number
  /** How long the overview takes to collapse or expand. */
  duration: number
}

/**
 * Reanimated's animated style, typed as the plain style the carousel's moving views take on
 * both platforms: they are Reanimated views on web, and Animated ones on mobile.
 */
type AnimatedViewStyle = ViewStyle

export interface WebCarouselStyles {
  /** How far the overview is collapsed, from 0 to its height. Moves its background. */
  collapse: SharedValue<number>
  /** Animates the overview open, as when a tab switch takes the pages to the top. */
  expandOverview: () => void
  /** Pushes the pages, and the cover above them, down by the open overview. */
  push: AnimatedViewStyle
  /** Scrolls the banners away above the tabs row. */
  header: AnimatedViewStyle
  /** Hides the floating bar together with the overview. */
  floatingBar: AnimatedViewStyle
}

/**
 * Web only, and `null` elsewhere: collapses the overview by an animation the scroll only
 * starts - down past the banners collapses it, a scroll up as long as `OVERVIEW_RETURN_DISTANCE`
 * or one back to the top expands it - so it always runs smoothly to the end, however the wheel
 * or the trackpad moves the page. The pages move with the pager rather than being held in
 * place, so there is never anything between the tabs and the first item.
 *
 * Drawn by Reanimated, which writes its styles straight to the DOM. Animated's JS driver - all
 * web has of it - re-renders every animated view through React on every frame instead.
 */
declare const useWebCarouselStyles: (options: WebCarouselStylesOptions) => WebCarouselStyles | null
export default useWebCarouselStyles
