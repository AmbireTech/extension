import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  InteractionManager,
  LayoutChangeEvent,
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
import DashboardCarouselContext from './context'
import { DashboardPagesCarouselProps } from './DashboardPagesCarousel'
import getStyles from './styles'

// The order must match the order the pages are rendered in, because the page
// index is what maps a swipe to a tab.
const TABS: TabType[] = ['tokens', 'collectibles', 'defi', 'activity']

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
  // A page is only worth rendering once the user is on their way to it. Every page
  // that was rendered is kept, but frozen, so returning to it costs nothing.
  const [mountedTabs, setMountedTabs] = useState<Partial<Record<TabType, boolean>>>({})
  const [isSwiping, setIsSwiping] = useState(false)
  const openTabIndex = Math.max(TABS.indexOf(openTab), 0)

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

  // Follows the tab that was selected by pressing a tab. Selecting it by swiping
  // resolves to a no-op, because the pager already sits at that offset. Aligning
  // after a resize or on mount (a deep link may open another tab) must not animate.
  const alignedTabIndexRef = useRef(openTabIndex)

  useEffect(() => {
    const animated = alignedTabIndexRef.current !== openTabIndex
    alignedTabIndexRef.current = openTabIndex

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
  // The neighbours are rendered here and not upfront, so the pages the user never
  // swipes to never cost anything. The pager itself scrolls on the UI thread, so
  // rendering them mid gesture doesn't make the swipe stutter.
  const onScrollBeginDrag = useCallback(() => {
    scrollY.setValue(0)
    setResetToken((prev) => prev + 1)
    setIsSwiping(true)
    setMountedTabs((prev) => {
      const next = { ...prev }

      ;[openTabIndex - 1, openTabIndex, openTabIndex + 1].forEach((index) => {
        const tab = TABS[index]

        if (tab) next[tab] = true
      })

      return next
    })
  }, [openTabIndex, scrollY])

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setIsSwiping(false)

      const tab = TABS[Math.round(event.nativeEvent.contentOffset.x / pageSize.width)]

      if (!tab || tab === openTab) return

      setOpenTab(tab)
      setSearchParams({ tab, sessionId })
    },
    [openTab, pageSize.width, sessionId, setOpenTab, setSearchParams]
  )

  const carousel = useMemo(
    () => ({ scrollY, headerHeight: bannersHeight + tabsHeight, resetToken }),
    [bannersHeight, resetToken, scrollY, tabsHeight]
  )

  const pages = useMemo(
    () =>
      React.Children.map(children, (child, index) => {
        const tab = TABS[index]
        const isOpen = !!tab && tab === openTab

        return (
          <CarouselPage
            style={pageSize}
            mounted={isOpen || (!!tab && !!mountedTabs[tab])}
            // Only the page the user is on is reconciled. The ones next to it are
            // thawed for the duration of the swipe, so they are ready when it lands.
            frozen={!isOpen && !isSwiping}
          >
            {child}
          </CarouselPage>
        )
      }),
    [children, isSwiping, mountedTabs, openTab, pageSize]
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
