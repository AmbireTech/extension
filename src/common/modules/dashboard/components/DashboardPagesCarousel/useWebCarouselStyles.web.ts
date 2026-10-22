import { useCallback, useMemo } from 'react'
import { ViewStyle } from 'react-native'
import {
  Easing,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import {
  OVERVIEW_RETURN_DISTANCE,
  WEB_OVERVIEW_COLLAPSE_START_DISTANCE
} from '@common/modules/dashboard/helpers/overviewCollapse'

import { WebCarouselStyles, WebCarouselStylesOptions } from './useWebCarouselStyles'

const useWebCarouselStyles = ({
  scrollOffset,
  bannersHeight,
  overviewHeight,
  floatingBarHideDistance,
  duration
}: WebCarouselStylesOptions): WebCarouselStyles => {
  const collapse = useSharedValue(0)
  const isCollapsed = useSharedValue(false)
  // Where the page's current scroll up began, or -1 while it is scrolled down
  const scrollUpStartOffset = useSharedValue(-1)

  const animateCollapse = useCallback(
    (shouldCollapse: boolean) => {
      'worklet'

      if (shouldCollapse === isCollapsed.get()) return

      isCollapsed.set(shouldCollapse)
      collapse.set(
        withTiming(shouldCollapse ? overviewHeight : 0, {
          duration,
          easing: Easing.inOut(Easing.sin)
        })
      )
    },
    [collapse, duration, isCollapsed, overviewHeight]
  )

  useAnimatedReaction(
    () => scrollOffset.get(),
    (offsetY, previousOffsetY) => {
      if (previousOffsetY === null || offsetY === previousOffsetY) return

      if (offsetY - bannersHeight <= WEB_OVERVIEW_COLLAPSE_START_DISTANCE) {
        scrollUpStartOffset.set(-1)
        animateCollapse(false)

        return
      }

      if (offsetY > previousOffsetY) {
        scrollUpStartOffset.set(-1)
        animateCollapse(true)

        return
      }

      if (scrollUpStartOffset.get() < 0) scrollUpStartOffset.set(previousOffsetY)

      if (scrollUpStartOffset.get() - offsetY >= OVERVIEW_RETURN_DISTANCE) animateCollapse(false)
    },
    [animateCollapse, bannersHeight]
  )

  const expandOverview = useCallback(() => {
    scrollUpStartOffset.set(-1)
    animateCollapse(false)
  }, [animateCollapse, scrollUpStartOffset])

  // Shown only along with the push for the measured overview: Reanimated applies a new height
  // a frame or more after the render that reveals the pages, which showed them collapsed
  const push = useAnimatedStyle(
    () => ({
      opacity: overviewHeight ? 1 : 0,
      transform: [{ translateY: overviewHeight - collapse.get() }]
    }),
    [overviewHeight]
  )

  const header = useAnimatedStyle(
    () => ({
      transform: [{ translateY: -Math.min(Math.max(scrollOffset.get(), 0), bannersHeight) }]
    }),
    [bannersHeight]
  )

  const floatingBar = useAnimatedStyle(
    () => ({
      transform: [
        {
          translateY: overviewHeight
            ? (collapse.get() / overviewHeight) * floatingBarHideDistance
            : 0
        }
      ]
    }),
    [floatingBarHideDistance, overviewHeight]
  )

  // Kept stable, as the carousel scrolls the pager to a pressed tab from an effect that
  // depends on it, and every new one would run it again - unanimated. Typed as the plain style
  // the moving views take, see `WebCarouselStyles`
  return useMemo(
    () => ({
      collapse,
      expandOverview,
      push: push as ViewStyle,
      header: header as ViewStyle,
      floatingBar: floatingBar as ViewStyle
    }),
    [collapse, expandOverview, floatingBar, header, push]
  )
}

export default useWebCarouselStyles
