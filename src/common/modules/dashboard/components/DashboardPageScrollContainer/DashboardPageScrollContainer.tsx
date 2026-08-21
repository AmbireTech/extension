import React, { FC, useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import {
  Animated,
  FlatList,
  FlatListProps,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ViewStyle
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { OVERVIEW_CONTENT_MAX_HEIGHT } from '../DashboardOverview/DashboardOverview'
import DashboardCarouselContext, {
  DashboardFloatingBarProps
} from '../DashboardPagesCarousel/context'
import debugCarousel from '../DashboardPagesCarousel/debug'
import { TabType } from '../TabsAndSearch/Tabs/Tab/Tab'
import useListTopSpacing from './useListTopSpacing'

interface Props extends FlatListProps<any> {
  tab: TabType
  openTab: TabType
  animatedOverviewHeight: Animated.Value
  refreshing?: boolean
  onRefresh?: () => void
  /** What the page wants in the bar the carousel renders above the pager. */
  floatingBar?: DashboardFloatingBarProps
}

// We do this instead of unmounting the component to prevent component rerendering when switching tabs.
const HIDDEN_STYLE: ViewStyle = {
  position: 'absolute',
  opacity: 0,
  display: 'none',
  // @ts-ignore
  pointerEvents: 'none'
}

const getFlatListStyle = (tab: TabType, openTab: TabType) => {
  // On mobile every page is a slide of the dashboard carousel, so they are all
  // laid out next to each other instead of only the open one being visible.
  if (isMobile) return [spacings.phSm, flexbox.flex1]

  return [spacings.phSm, openTab !== tab ? HIDDEN_STYLE : {}]
}

// The pages of the carousel report their scroll offset natively, so the header
// laid over them can collapse without a round trip through JS.
const AnimatedFlatList = Animated.FlatList as unknown as typeof FlatList

// All four pages of the carousel are rendered, so none of them may build more than
// it has to: a screenful up front, the rest as the list is scrolled. Overrides what
// the pages ask for, as those values are sized for being the only rendered list.
const CAROUSEL_VIRTUALIZATION = {
  initialNumToRender: 10,
  maxToRenderPerBatch: 10,
  windowSize: 10
}

const NO_PROPS = {}

const DashboardPageScrollContainer: FC<Props> = ({
  tab,
  openTab,
  animatedOverviewHeight,
  refreshing,
  onRefresh,
  onScroll,
  floatingBar,
  ...rest
}) => {
  const topSpacing = useListTopSpacing()
  const flatlistRef = useRef<FlatList | null>(null)
  const { bottom } = useSafeAreaInsets()
  const style = useMemo(() => getFlatListStyle(tab, openTab), [openTab, tab])
  const { theme } = useTheme()
  const carousel = useContext(DashboardCarouselContext)
  const contentContainerStyle = useMemo(() => {
    return [
      topSpacing,
      { flexGrow: 1 },
      isMobile && { paddingBottom: bottom || SPACING_SM },
      // A page with less content than this cannot scroll far enough to hold the header
      // collapsed, and would report its way back to the top the moment it is touched.
      // Padding would not do: flexGrow stretches the content box to the page either
      // way, padding included, leaving nothing to scroll.
      !!carousel &&
        !!carousel.pageHeight && {
          minHeight: carousel.pageHeight + carousel.collapsibleHeight
        },
      // Must come last, as it overrides the padding of the non-carousel layout
      !!carousel && { paddingTop: carousel.headerHeight }
    ]
  }, [bottom, carousel, topSpacing])

  // iOS draws the scroll indicator against the scroll view's frame rather than its
  // content, so padding the content away from the overlaid header leaves the
  // indicator running underneath it. It has to be inset by the header separately.
  const carouselIndicatorProps = useMemo(() => {
    if (!carousel) return NO_PROPS

    return {
      scrollIndicatorInsets: { top: carousel.headerHeight },
      // Left on, iOS recomputes the insets off the safe area and drops the one above
      automaticallyAdjustsScrollIndicatorInsets: false
    }
  }, [carousel])

  // Bound to the value and not to the whole context, so measuring the header
  // doesn't detach and reattach the native scroll listener. Mobile passes no
  // onScroll, which leaves the offset to be mapped natively with no JS listener.
  //
  // Only the open page reports into it. The value is shared by all of them, and a
  // page with too little content to scroll as far as the others reports the offset
  // it stopped at instead - which, coming in last, would be the one that stuck.
  const carouselScrollY = carousel?.scrollY
  const handleScroll = useMemo(() => {
    if (!carouselScrollY || openTab !== tab) return onScroll

    return Animated.event(
      [{ nativeEvent: { contentOffset: { y: carouselScrollY } } }],
      onScroll ? { useNativeDriver: true, listener: onScroll } : { useNativeDriver: true }
    )
  }, [carouselScrollY, onScroll, openTab, tab])

  // Reset scroll position when switching tabs (new). The carousel does this itself,
  // for every page and carrying over how far the banners are collapsed.
  useEffect(() => {
    if (!flatlistRef.current || carousel) return

    if (openTab === tab) {
      // Scroll to top
      flatlistRef.current?.scrollToOffset({ offset: 0, animated: false })

      // Expand overview
      Animated.spring(animatedOverviewHeight, {
        toValue: OVERVIEW_CONTENT_MAX_HEIGHT,
        bounciness: 0,
        speed: 2.8,
        overshootClamping: true,
        useNativeDriver: false
      }).start()
    }
  }, [animatedOverviewHeight, carousel, openTab, tab])

  // Lets the header and a swipe scroll this page - a drag on the header never reaches
  // the list it is laid over, and a swipe has to take every page to the top.
  const registerPage = carousel?.registerPage

  const scrollToOffset = useCallback(
    (offset: number) => {
      debugCarousel('page:scrollToOffset', {
        tab,
        offset,
        canScroll: typeof flatlistRef.current?.scrollToOffset === 'function'
      })
      flatlistRef.current?.scrollToOffset({ offset, animated: false })
    },
    [tab]
  )

  // TEMPORARY: reports where the list actually came to rest, to compare against the
  // offset the carousel reads off the native animated node.
  const onScrollSettled = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      debugCarousel('page:settled', { tab, offset: event.nativeEvent.contentOffset.y })
    },
    [tab]
  )

  useEffect(() => {
    debugCarousel('page:mounted', { tab })

    return () => debugCarousel('page:unmounted', { tab })
  }, [tab])

  useEffect(() => {
    if (!registerPage) return undefined

    registerPage(tab, { scrollToOffset })

    return () => registerPage(tab, null)
  }, [registerPage, scrollToOffset, tab])

  const registerFloatingBar = carousel?.registerFloatingBar

  useEffect(() => {
    if (!registerFloatingBar) return undefined

    registerFloatingBar(tab, floatingBar || null)

    return () => registerFloatingBar(tab, null)
  }, [floatingBar, registerFloatingBar, tab])

  const ListComponent = carousel ? AnimatedFlatList : FlatList

  return (
    <ListComponent
      ref={flatlistRef}
      style={style}
      contentContainerStyle={contentContainerStyle}
      // Makes the header sticky. The carousel lays its own header over the pages instead
      stickyHeaderIndices={carousel ? undefined : [1]}
      removeClippedSubviews
      bounces
      alwaysBounceVertical
      scrollEventThrottle={16}
      onScroll={handleScroll}
      onScrollEndDrag={carousel ? onScrollSettled : undefined}
      onMomentumScrollEnd={carousel ? onScrollSettled : undefined}
      refreshControl={
        isMobile ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={theme.iconPrimary}
            progressBackgroundColor={theme.secondaryBackground}
            progressViewOffset={carousel?.headerHeight}
          />
        ) : undefined
      }
      {...rest}
      {...(carousel ? CAROUSEL_VIRTUALIZATION : NO_PROPS)}
      {...carouselIndicatorProps}
    />
  )
}

export default React.memo(DashboardPageScrollContainer)
