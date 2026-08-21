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

import useTheme from '@common/hooks/useTheme'
import DashboardBanners from '@common/modules/dashboard/components/DashboardBanners'
import TabsAndSearch from '@common/modules/dashboard/components/TabsAndSearch'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import CarouselPage from './CarouselPage'
import DashboardCarouselContext, { DashboardPageHandle } from './context'
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

const DashboardPagesCarousel: React.FC<DashboardPagesCarouselProps> = ({
  openTab,
  setOpenTab,
  sessionId,
  initAllTabs,
  children
}) => {
  const { styles } = useTheme(getStyles)
  const scrollRef = useRef<ScrollView>(null)
  const [, setSearchParams] = useSearchParams()
  const scrollY = useMemo(() => new Animated.Value(0), [])
  // The pages are explicitly sized because a page taller than the pager would
  // make the pager scroll vertically instead of the list inside it.
  const [pageSize, setPageSize] = useState({ width: Dimensions.get('window').width, height: 0 })
  const [bannersHeight, setBannersHeight] = useState(0)
  const [tabsHeight, setTabsHeight] = useState(0)
  const [resetToken, setResetToken] = useState(0)
  const [renderedTabs, setRenderedTabs] = useState<Partial<Record<TabType, boolean>>>(() => ({
    [openTab]: true
  }))
  const openTabIndex = Math.max(TABS.indexOf(openTab), 0)
  const pageHandles = useRef<Partial<Record<TabType, DashboardPageHandle>>>({})

  const registerPage = useCallback((tab: TabType, handle: DashboardPageHandle | null) => {
    if (handle) {
      pageHandles.current[tab] = handle
    } else {
      delete pageHandles.current[tab]
    }
  }, [])

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
  useEffect(() => {
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
  }, [openTabIndex, renderTabs])

  useEffect(() => {
    const interaction = InteractionManager.runAfterInteractions(initAllTabs)

    return () => interaction.cancel()
  }, [initAllTabs])

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
    const animated = alignedTabIndexRef.current !== openTabIndex
    alignedTabIndexRef.current = openTabIndex

    // A swipe already put the pager where the open tab followed it to
    if (isPagerDrivenRef.current) return

    scrollRef.current?.scrollTo({ x: openTabIndex * pageSize.width, animated })
  }, [openTabIndex, pageSize.width])

  // Opening another tab scrolls its list back to the top, so the banners have to
  // be revealed again. The list itself won't report it if it already was at the top.
  useEffect(() => {
    scrollY.setValue(0)
  }, [openTab, scrollY])

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

  // The header is shared by all pages, so it would have to jump to match the page
  // the swipe lands on. Returning every page to the top while the swipe is still
  // in progress keeps that in line with opening a tab by pressing it.
  //
  // The pages a swipe can reach are rendered here too, in case it comes in before
  // they were reached in order.
  const onScrollBeginDrag = useCallback(() => {
    isPagerDrivenRef.current = true
    dragStartTabRef.current = openTab
    scrollY.setValue(0)
    setResetToken((prev) => prev + 1)
    renderTabs([TABS[openTabIndex - 1], TABS[openTabIndex + 1]])
  }, [openTab, openTabIndex, renderTabs, scrollY])

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
    () => ({ scrollY, headerHeight: bannersHeight + tabsHeight, resetToken, registerPage }),
    [bannersHeight, registerPage, resetToken, scrollY, tabsHeight]
  )

  // Enough banners cover a page whole, and the header is laid over it, so without
  // dragging the open page by the header there would be nothing left to drag it by.
  const touchStartY = useRef(0)
  const touchStartOffset = useRef(0)

  // Taps are left to the banners and the tabs, so this only records where they began
  const onHeaderTouchStart = useCallback(({ nativeEvent }: GestureResponderEvent) => {
    touchStartY.current = nativeEvent.pageY

    return false
  }, [])

  // Captured, so a drag that started on a banner is taken away from it the way a
  // scroll view takes over from a button inside it
  const onHeaderTouchMove = useCallback(
    ({ nativeEvent }: GestureResponderEvent) =>
      Math.abs(nativeEvent.pageY - touchStartY.current) > HEADER_PAN_THRESHOLD,
    []
  )

  const onHeaderDragStart = useCallback(() => {
    touchStartOffset.current = pageHandles.current[openTab]?.getRestingOffset() || 0
  }, [openTab])

  const onHeaderDrag = useCallback(
    ({ nativeEvent }: GestureResponderEvent) => {
      const dragged = nativeEvent.pageY - touchStartY.current

      pageHandles.current[openTab]?.scrollToOffset(Math.max(touchStartOffset.current - dragged, 0))
    },
    [openTab]
  )

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
        onResponderGrant={onHeaderDragStart}
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
    </View>
  )
}

export default React.memo(DashboardPagesCarousel)
