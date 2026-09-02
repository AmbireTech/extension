import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  InteractionManager,
  LayoutChangeEvent,
  GestureResponderEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated'

import Spinner from '@common/components/Spinner'
import { useIsScreenFocused } from '@common/contexts/screenFocusContext'
import useTheme from '@common/hooks/useTheme'
import DashboardBanners from '@common/modules/dashboard/components/DashboardBanners'
import FloatingBottomBar from '@common/modules/dashboard/components/FloatingBottomBar'
import TabsAndSearch from '@common/modules/dashboard/components/TabsAndSearch'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import CarouselPage from './CarouselPage'
import DashboardCarouselContext, { DashboardFloatingBarProps, DashboardPageHandle } from './context'
import { DashboardPagesCarouselProps } from './DashboardPagesCarousel'
import getStyles from './styles'

// The order must match the order the pages are rendered in, because the page
// index is what maps a swipe to a tab.
const TABS: TabType[] = ['tokens', 'defi', 'collectibles', 'activity']

// Every page is rendered, but one at a time and only once the open one is done
// filling its own render window, so none of it lands during a gesture.
const PAGE_RENDER_DELAY = 400
const PAGE_RENDER_STEP = 200

// How far a touch on the header has to travel before it is taken to be a scroll and
// not a tap on a banner or a tab.
const HEADER_PAN_THRESHOLD = 5

// How far the finger has to travel past the top to refresh, whether it pulls the header
// or a page. Deliberately long: refreshing everything is not something to walk into by
// brushing the screen, and the platform controls trigger at less than half of this.
const PULL_TO_REFRESH_DISTANCE = 140

// How far a touch has to travel before it is taken to be a pull rather than a tap
const PULL_ACTIVATION_THRESHOLD = 12

// The pages follow the finger at half its pace, so the pull reads as something being
// resisted rather than dragged, and the distance stays a deliberate one.
const PULL_RESISTANCE = 0.5

// The gap the pages are held open by while the refresh runs, sized to the spinner
const PULL_SPINNER_HEIGHT = 56

const DashboardPagesCarousel: React.FC<DashboardPagesCarouselProps> = ({
  openTab,
  setOpenTab,
  sessionId,
  initAllTabs,
  onRefresh,
  refreshing,
  children
}) => {
  const { styles } = useTheme(getStyles)
  const isScreenFocused = useIsScreenFocused()
  const scrollRef = useRef<ScrollView>(null)
  const scrollY = useMemo(() => new Animated.Value(0), [])
  // The pages are explicitly sized because a page taller than the pager would
  // make the pager scroll vertically instead of the list inside it.
  const [pageSize, setPageSize] = useState({ width: Dimensions.get('window').width, height: 0 })
  const [bannersHeight, setBannersHeight] = useState(0)
  const [tabsHeight, setTabsHeight] = useState(0)
  const [renderedTabs, setRenderedTabs] = useState<Partial<Record<TabType, boolean>>>(() => ({
    [openTab]: true
  }))
  const openTabIndex = Math.max(TABS.indexOf(openTab), 0)
  const pageHandles = useRef<Partial<Record<TabType, DashboardPageHandle>>>({})
  const [floatingBars, setFloatingBars] = useState<
    Partial<Record<TabType, DashboardFloatingBarProps>>
  >({})

  const registerFloatingBar = useCallback((tab: TabType, bar: DashboardFloatingBarProps | null) => {
    setFloatingBars((prev) => {
      if (prev[tab] === (bar || undefined)) return prev

      const next = { ...prev }

      if (bar) {
        next[tab] = bar
      } else {
        delete next[tab]
      }

      return next
    })
  }, [])

  // Whether the open page has anything above it. Reported by the page as it scrolls
  // rather than asked for when a touch lands: asking is a round trip to the native side
  // that answers after the drag has already been judged, and it answers with the header
  // collapse the carousel keeps, which a page too short to take it never matches.
  // Pages start at their top, which is what makes this the value to start from.
  const canPull = useSharedValue(true)

  // Kept stable by hand, because the pages read it off the context and a new one every
  // render would re-render all four. A shared value is stable for the life of the
  // component, so leaving it out of the dependencies is what keeps it correct here.
  const reportScrollOffset = useCallback((offset: number) => {
    canPull.value = offset <= 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // How far the banners are collapsed, which every page shares. A page whose items
  // start right below the tabs row sits at this offset, not at zero.
  const collapsedBy = useRef(0)

  // Held in state rather than alongside the handles, because the pull gesture is built
  // during render and has to be given the lists it takes a drag away from.
  const [pageListGestures, setPageListGestures] = useState<
    Partial<Record<TabType, DashboardPageHandle['listGesture']>>
  >({})

  const registerPage = useCallback((tab: TabType, handle: DashboardPageHandle | null) => {
    setPageListGestures((prev) => {
      if (prev[tab] === handle?.listGesture) return prev

      const next = { ...prev }

      if (handle) {
        next[tab] = handle.listGesture
      } else {
        delete next[tab]
      }

      return next
    })

    if (!handle) {
      delete pageHandles.current[tab]
      return
    }

    pageHandles.current[tab] = handle
    // A page rendered while the banners are already collapsed would start below them
    if (collapsedBy.current) handle.scrollToOffset(collapsedBy.current)
  }, [])

  // Opening a tab takes its page to the top but leaves the banners as collapsed as they
  // were: they belong to the dashboard, not to the page. The offset is read back from
  // the native side, since the pages report their scroll straight into the animated
  // node and the value held here is only whatever JS last wrote.
  const takePagesToTop = useCallback(() => {
    scrollY.stopAnimation((offset) => {
      const carried = Math.min(Math.max(offset, 0), bannersHeight)

      collapsedBy.current = carried
      scrollY.setValue(carried)
      reportScrollOffset(carried)
      TABS.forEach((tab) => pageHandles.current[tab]?.scrollToOffset(carried))
    })
  }, [bannersHeight, reportScrollOffset, scrollY])

  const renderTabs = useCallback((tabs: (TabType | undefined)[]) => {
    setRenderedTabs((prev) => {
      const missing = tabs.filter((tab): tab is TabType => !!tab && !prev[tab])

      if (!missing.length) return prev

      const next = { ...prev }

      missing.forEach((tab) => {
        next[tab] = true
      })

      return next
    })
  }, [])

  // Every page ends up rendered, so no swipe can outrun them: closest first and one at
  // a time, never during a gesture or in the same frame as another. Only while this is
  // the screen the user is on, or the rest would be built over the screen it was left for.
  useEffect(() => {
    if (!isScreenFocused) return undefined

    let isCancelled = false
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    const byDistanceToOpenTab = TABS.map((tab, index) => ({
      tab,
      distance: Math.abs(index - openTabIndex)
    }))
      .sort((a, b) => a.distance - b.distance)
      .map(({ tab }) => tab)

    const renderFrom = (index: number) => {
      if (isCancelled || index >= byDistanceToOpenTab.length) return

      renderTabs([byDistanceToOpenTab[index]])

      timeoutId = setTimeout(() => renderFrom(index + 1), PAGE_RENDER_STEP)
    }

    const interaction = InteractionManager.runAfterInteractions(() => {
      timeoutId = setTimeout(() => renderFrom(0), PAGE_RENDER_DELAY)
    })

    return () => {
      isCancelled = true
      interaction.cancel()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [isScreenFocused, openTabIndex, renderTabs])

  // Deferred until the interactions are over, and a navigation away is one of them,
  // so this has to ask whether the dashboard is still the screen it was deferred on.
  useEffect(() => {
    if (!isScreenFocused) return undefined

    const interaction = InteractionManager.runAfterInteractions(initAllTabs)

    return () => interaction.cancel()
  }, [initAllTabs, isScreenFocused])

  const onLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setPageSize((prev) =>
      prev.width === layout.width && prev.height === layout.height
        ? prev
        : { width: layout.width, height: layout.height }
    )
  }, [])

  const onBannersLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setBannersHeight(layout.height)
  }, [])

  const onTabsLayout = useCallback(({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setTabsHeight(layout.height)
  }, [])

  // Follows the tab that was selected by pressing a tab. Aligning after a resize or
  // on mount (a deep link may open another tab) must not animate.
  const alignedTabIndexRef = useRef(openTabIndex)
  const isPagerDrivenRef = useRef(false)

  useEffect(() => {
    const previousTabIndex = alignedTabIndexRef.current
    const hasTabChanged = previousTabIndex !== openTabIndex
    alignedTabIndexRef.current = openTabIndex

    // A swipe already put the pager where the open tab followed it to, and took the
    // pages to the top when it started
    if (isPagerDrivenRef.current) return

    if (hasTabChanged) takePagesToTop()

    scrollRef.current?.scrollTo({ x: openTabIndex * pageSize.width, animated: hasTabChanged })
  }, [openTab, openTabIndex, pageSize.width, takePagesToTop])

  // Only the banners scroll out of view; the tabs row stays. With no banners there is
  // nothing to collapse, and a zero range would shift the tabs row on the first pixel.
  const headerTranslateY = useMemo(() => {
    if (!bannersHeight) return 0

    return scrollY.interpolate({
      inputRange: [0, bannersHeight],
      outputRange: [0, -bannersHeight],
      extrapolate: 'clamp'
    })
  }, [bannersHeight, scrollY])

  // The header is shared, so it would have to jump to match the page a swipe lands on:
  // taking every page to the top mid-swipe keeps that in line with pressing a tab. The
  // pages a swipe can reach are rendered here too, in case it beats the ordered build.
  const onScrollBeginDrag = useCallback(() => {
    isPagerDrivenRef.current = true
    takePagesToTop()
    renderTabs([TABS[openTabIndex - 1], TABS[openTabIndex + 1]])
  }, [openTabIndex, renderTabs, takePagesToTop])

  // The open tab follows the pager past the halfway point, so the tabs row does not wait
  // for the swipe to settle. Only under a gesture: scrolling to a pressed tab reports
  // every page it passes, and those are not the selection.
  const onPagerScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isPagerDrivenRef.current) return

      const tab = TABS[Math.round(event.nativeEvent.contentOffset.x / pageSize.width)]

      if (!tab || tab === openTab) return

      setOpenTab(tab)
    },
    [openTab, pageSize.width, setOpenTab]
  )

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      isPagerDrivenRef.current = false

      const tab = TABS[Math.round(event.nativeEvent.contentOffset.x / pageSize.width)]

      if (!tab) return

      if (tab !== openTab) setOpenTab(tab)
    },
    [openTab, pageSize.width, setOpenTab]
  )

  const carousel = useMemo(
    () => ({
      scrollY,
      headerHeight: bannersHeight + tabsHeight,
      collapsibleHeight: bannersHeight,
      pageHeight: pageSize.height,
      registerPage,
      reportScrollOffset,
      registerFloatingBar
    }),
    [
      bannersHeight,
      pageSize.height,
      registerFloatingBar,
      registerPage,
      reportScrollOffset,
      scrollY,
      tabsHeight
    ]
  )

  const pullStartX = useSharedValue(0)
  const pullStartY = useSharedValue(0)
  const pulled = useSharedValue(0)
  const spinnerGap = useSharedValue(0)
  const [isPulling, setIsPulling] = useState(false)

  // A drag on the header past the top opens the pages the same way a pull on one of
  // them does, so the two report themselves identically. Tracked in a ref as well, so
  // that following the finger costs no render.
  const isHeaderPullingRef = useRef(false)

  // Plain functions: a shared value may not be listed as a dependency of a hook and
  // then written to, and following the finger is exactly writing to one.
  const startHeaderPull = () => {
    if (isHeaderPullingRef.current) return

    isHeaderPullingRef.current = true
    setIsPulling(true)
  }

  const endHeaderPull = () => {
    if (!isHeaderPullingRef.current) return

    isHeaderPullingRef.current = false
    setIsPulling(false)
    pulled.value = withTiming(0, { duration: 200 })
  }

  // Enough banners cover a page whole, and the header is laid over it, so without
  // dragging the open page by the header there would be nothing left to drag it by.
  const touchStartY = useRef(0)
  const touchStartOffset = useRef(0)
  const hasPulledToRefresh = useRef(false)

  // Taps belong to the banners and the tabs, so this only records where the touch began
  // and asks the native side where the open page is - answered long before a drag.
  const onHeaderTouchStart = useCallback(
    ({ nativeEvent }: GestureResponderEvent) => {
      touchStartY.current = nativeEvent.pageY
      hasPulledToRefresh.current = false
      scrollY.stopAnimation((offset) => {
        touchStartOffset.current = Math.max(offset, 0)
      })

      return false
    },
    [scrollY]
  )

  // Captured, so a drag that started on a banner is taken away from it the way a
  // scroll view takes over from a button inside it
  const onHeaderTouchMove = useCallback(
    ({ nativeEvent }: GestureResponderEvent) =>
      Math.abs(nativeEvent.pageY - touchStartY.current) > HEADER_PAN_THRESHOLD,
    []
  )

  const onHeaderDrag = ({ nativeEvent }: GestureResponderEvent) => {
    const dragged = nativeEvent.pageY - touchStartY.current
    const offset = touchStartOffset.current - dragged

    pageHandles.current[openTab]?.scrollToOffset(Math.max(offset, 0))

    // Past the top, which the open page cannot be scrolled to. The pages are pulled
    // open instead, exactly as a pull on one of them does it, so a drag on a banner is
    // answered the same way as a drag on the list under it.
    if (offset >= 0) {
      endHeaderPull()

      return
    }

    startHeaderPull()
    pulled.value = -offset

    if (offset <= -PULL_TO_REFRESH_DISTANCE) {
      if (hasPulledToRefresh.current || !onRefresh) return

      hasPulledToRefresh.current = true
      onRefresh()
    }
  }

  const requestRefresh = useCallback(() => {
    if (!onRefresh) return

    onRefresh()
  }, [onRefresh])

  // Held open for as long as the refresh runs, however it was asked for, so a pull on
  // the header and a pull on a page report themselves the same way.
  useEffect(() => {
    spinnerGap.value = withTiming(refreshing ? PULL_SPINNER_HEIGHT : 0, { duration: 200 })
  }, [refreshing, spinnerGap])

  // A page that can be scrolled claims the drag before the pull can judge it, so the
  // pages' scrolling is told to wait for the pull to fail. Without it the pull only ever
  // worked on a page short enough not to scroll - which, with banners above it, none is.
  const pageLists = useMemo(() => Object.values(pageListGestures), [pageListGestures])

  // Activated by hand, because whether a downward drag is a pull or the page being
  // scrolled back up is only answerable once the open page's offset is known. Failing
  // rather than activating leaves the touch to the pager and the list, untouched.
  const pullGesture = Gesture.Pan()
    .enabled(!!onRefresh)
    .manualActivation(true)
    .blocksExternalGesture(...pageLists)
    .onTouchesDown((event) => {
      const touch = event.allTouches[0]

      if (!touch) return

      pullStartX.value = touch.absoluteX
      pullStartY.value = touch.absoluteY
    })
    .onTouchesMove((event, manager) => {
      const touch = event.allTouches[0]

      if (!touch) return

      const draggedX = touch.absoluteX - pullStartX.value
      const draggedY = touch.absoluteY - pullStartY.value

      // A swipe between tabs, or the page being scrolled - neither of them is a pull
      if (Math.abs(draggedX) > Math.abs(draggedY) || draggedY < 0 || !canPull.value) {
        manager.fail()

        return
      }

      if (draggedY > PULL_ACTIVATION_THRESHOLD) manager.activate()
    })
    .onStart(() => {
      runOnJS(setIsPulling)(true)
    })
    .onUpdate(({ translationY }) => {
      pulled.value = Math.max(translationY, 0)
    })
    .onEnd(({ translationY }) => {
      if (translationY >= PULL_TO_REFRESH_DISTANCE) runOnJS(requestRefresh)()
    })
    .onFinalize(() => {
      pulled.value = withTiming(0, { duration: 200 })
      runOnJS(setIsPulling)(false)
    })

  // Transformed rather than laid out again, so a pull costs the pages no re-render
  const pagerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.max(pulled.value * PULL_RESISTANCE, spinnerGap.value) }]
  }))

  // Clipped to the gap the pages have opened, so the spinner is revealed by the pull
  // instead of being drawn over the page under it
  const spinnerStyle = useAnimatedStyle(() => {
    const gap = Math.max(pulled.value * PULL_RESISTANCE, spinnerGap.value)

    return { height: gap, opacity: Math.min(gap / PULL_SPINNER_HEIGHT, 1) }
  })

  const openTabFloatingBar = floatingBars[openTab]

  const pages = useMemo(
    () =>
      React.Children.map(children, (child, index) => {
        const tab = TABS[index]

        return (
          <CarouselPage
            style={pageSize}
            rendered={!!tab && (tab === openTab || !!renderedTabs[tab])}
          >
            {child}
          </CarouselPage>
        )
      }),
    [children, openTab, pageSize, renderedTabs]
  )

  return (
    <View style={styles.container}>
      <View style={flexbox.flex1} onLayout={onLayout}>
        <DashboardCarouselContext.Provider value={carousel}>
          {(isPulling || !!refreshing) && (
            <Reanimated.View
              pointerEvents="none"
              style={[styles.pullSpinner, { top: bannersHeight + tabsHeight }, spinnerStyle]}
            >
              <Spinner style={styles.pullSpinnerIcon} />
            </Reanimated.View>
          )}
          <GestureDetector gesture={pullGesture}>
            <Reanimated.View style={[flexbox.flex1, pagerStyle]}>
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                directionalLockEnabled
                showsHorizontalScrollIndicator={false}
                decelerationRate="fast"
                scrollEventThrottle={16}
                onScroll={onPagerScroll}
                onScrollBeginDrag={onScrollBeginDrag}
                onMomentumScrollEnd={onMomentumScrollEnd}
              >
                {pages}
              </ScrollView>
            </Reanimated.View>
          </GestureDetector>
        </DashboardCarouselContext.Provider>
      </View>
      {/* The banners and the tabs row are account wide, so they are laid over the
      pager instead of moving with it. Rendered after it, because zIndex alone is
      not enough to keep them on top on Android. The pages used to render them
      inside a list that adds this padding on top of the one the tabs row has */}
      <Animated.View
        onStartShouldSetResponderCapture={onHeaderTouchStart}
        onMoveShouldSetResponderCapture={onHeaderTouchMove}
        onResponderMove={onHeaderDrag}
        onResponderRelease={endHeaderPull}
        onResponderTerminate={endHeaderPull}
        style={[styles.header, spacings.phSm, { transform: [{ translateY: headerTranslateY }] }]}
      >
        <View onLayout={onBannersLayout}>
          <DashboardBanners />
        </View>
        <View onLayout={onTabsLayout}>
          <TabsAndSearch
            openTab={openTab}
            setOpenTab={setOpenTab}
            currentTab={openTab}
            sessionId={sessionId}
          />
        </View>
      </Animated.View>
      {/* Outside the pager, so a swipe doesn't carry it along, and only what the open
      tab put in it changes */}
      {!!openTabFloatingBar && <FloatingBottomBar {...openTabFloatingBar} isHidden={false} />}
    </View>
  )
}

export default React.memo(DashboardPagesCarousel)
