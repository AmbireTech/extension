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
import { useSearchParams } from 'react-router-dom'

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
const TABS: TabType[] = ['tokens', 'collectibles', 'defi', 'activity']

// Every page is rendered, but one at a time and only once the open one is done
// filling its own render window, so none of it lands during a gesture.
const PAGE_RENDER_DELAY = 400
const PAGE_RENDER_STEP = 200

// How far a touch on the header has to travel before it is taken to be a scroll and
// not a tap on a banner or a tab.
const HEADER_PAN_THRESHOLD = 5

// How far past the top the header has to be pulled to refresh. The pages are already
// back at the top by then, so this is the distance on top of undoing the collapse.
const HEADER_PULL_TO_REFRESH_DISTANCE = 80

const DashboardPagesCarousel: React.FC<DashboardPagesCarouselProps> = ({
  openTab,
  setOpenTab,
  sessionId,
  initAllTabs,
  onRefresh,
  children
}) => {
  const { styles } = useTheme(getStyles)
  const isScreenFocused = useIsScreenFocused()
  const scrollRef = useRef<ScrollView>(null)
  const [, setSearchParams] = useSearchParams()
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

  // How far the banners are collapsed, which every page shares. A page whose items
  // start right below the tabs row sits at this offset, not at zero.
  const collapsedBy = useRef(0)

  const registerPage = useCallback((tab: TabType, handle: DashboardPageHandle | null) => {
    if (!handle) {
      delete pageHandles.current[tab]
      return
    }

    pageHandles.current[tab] = handle
    // A page rendered while the banners are already collapsed would start below them
    if (collapsedBy.current) handle.scrollToOffset(collapsedBy.current)
  }, [])

  // Opening another tab takes the items of the page it opens to the top, but leaves
  // the banners as collapsed as they were - they belong to the dashboard, not to the
  // page, so a tab change is no reason to bring them back.
  //
  // The offset has to be read back from the native side: the pages report their scroll
  // straight into the native animated node, so the value this side holds is only ever
  // whatever JS last wrote to it.
  const takePagesToTop = useCallback(() => {
    scrollY.stopAnimation((offset) => {
      const carried = Math.min(Math.max(offset, 0), bannersHeight)

      collapsedBy.current = carried
      scrollY.setValue(carried)
      TABS.forEach((tab) => pageHandles.current[tab]?.scrollToOffset(carried))
    })
  }, [bannersHeight, scrollY])

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

  // Every page ends up rendered, so no swipe can outrun them however fast they come.
  // Closest first, and one at a time, so a page is never built during a gesture and
  // never in the same frame as another one.
  //
  // Only while this is the screen the user is on, or the pages still to be built
  // would be built on top of whichever screen the dashboard was left for.
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
  const dragStartTabRef = useRef(openTab)

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

  // Only the banners are scrolled out of view - the tabs row below them stays. With
  // no banners there is nothing to collapse, and interpolating over a zero range
  // would shift the tabs row by the range's lower bound on the first pixel scrolled.
  const headerTranslateY = useMemo(() => {
    if (!bannersHeight) return 0

    return scrollY.interpolate({
      inputRange: [0, bannersHeight],
      outputRange: [0, -bannersHeight],
      extrapolate: 'clamp'
    })
  }, [bannersHeight, scrollY])

  // The header is shared by all pages, so it would have to jump to match the page the
  // swipe lands on. Taking them all to the top while the swipe is still in progress
  // keeps that in line with opening a tab by pressing it.
  //
  // The pages a swipe can reach are rendered here too, in case it comes in before
  // they were reached in order.
  const onScrollBeginDrag = useCallback(() => {
    isPagerDrivenRef.current = true
    dragStartTabRef.current = openTab
    takePagesToTop()
    renderTabs([TABS[openTabIndex - 1], TABS[openTabIndex + 1]])
  }, [openTab, openTabIndex, renderTabs, takePagesToTop])

  // The open tab follows the pager as soon as it is past the halfway point, so the
  // tabs row doesn't wait for the swipe to settle to catch up with it. Only while the
  // pager follows a gesture - scrolling it to a tab that was pressed reports every
  // page it passes on the way, and those are not the selection.
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
      const wasDragged = isPagerDrivenRef.current
      isPagerDrivenRef.current = false

      const tab = TABS[Math.round(event.nativeEvent.contentOffset.x / pageSize.width)]

      if (!tab) return

      if (tab !== openTab) setOpenTab(tab)

      // Left until the swipe is over, so it doesn't drag a route update through the
      // gesture. A swipe that ends back where it started changed nothing, and a tab
      // that was pressed wrote it already.
      if (wasDragged && tab !== dragStartTabRef.current) setSearchParams({ tab, sessionId })
    },
    [openTab, pageSize.width, sessionId, setOpenTab, setSearchParams]
  )

  const carousel = useMemo(
    () => ({
      scrollY,
      headerHeight: bannersHeight + tabsHeight,
      collapsibleHeight: bannersHeight,
      pageHeight: pageSize.height,
      registerPage,
      registerFloatingBar
    }),
    [bannersHeight, pageSize.height, registerFloatingBar, registerPage, scrollY, tabsHeight]
  )

  // Enough banners cover a page whole, and the header is laid over it, so without
  // dragging the open page by the header there would be nothing left to drag it by.
  const touchStartY = useRef(0)
  const touchStartOffset = useRef(0)
  const hasPulledToRefresh = useRef(false)

  // Taps are left to the banners and the tabs, so this only records where the touch
  // began - and asks the native side where the open page is, which has landed well
  // before the touch has travelled far enough to count as a drag.
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

  const onHeaderDrag = useCallback(
    ({ nativeEvent }: GestureResponderEvent) => {
      const dragged = nativeEvent.pageY - touchStartY.current
      const offset = touchStartOffset.current - dragged

      // Pulled past the top, which the open page cannot be scrolled to. Refreshing is
      // requested here instead, and the page's refresh control shows it as its own.
      if (offset <= -HEADER_PULL_TO_REFRESH_DISTANCE) {
        if (hasPulledToRefresh.current || !onRefresh) return

        hasPulledToRefresh.current = true
        // The page's refresh control reveals itself by scrolling up by its own height
        // from wherever the page is, and on that path it draws at the page's top rather
        // than at the offset that keeps it clear of the header. Pulling the page down by
        // the header first leaves the spinner where a pulled page would have put it.
        pageHandles.current[openTab]?.scrollToOffset(-(bannersHeight + tabsHeight))
        onRefresh()

        return
      }

      pageHandles.current[openTab]?.scrollToOffset(Math.max(offset, 0))
    },
    [bannersHeight, onRefresh, openTab, tabsHeight]
  )

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
