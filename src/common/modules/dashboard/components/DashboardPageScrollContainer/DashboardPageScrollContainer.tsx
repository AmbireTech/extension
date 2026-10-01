import React, { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  FlatList,
  FlatListProps,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  View,
  ViewStyle
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import { OVERVIEW_CONTENT_MAX_HEIGHT } from '../DashboardOverview/DashboardOverview'
import DashboardCarouselContext, {
  DashboardFloatingBarProps
} from '../DashboardPagesCarousel/context'
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

// All four pages are rendered, so none may build more than a screenful up front.
// Overrides the pages' own values, which assume being the only rendered list.
const CAROUSEL_VIRTUALIZATION = {
  initialNumToRender: 10,
  maxToRenderPerBatch: 10,
  windowSize: 10
}

const NO_PROPS = {}

// Stretches the footer over whatever the items leave of the content's min height
const FOOTER_STYLE: ViewStyle = { flexGrow: 1 }

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
  // Names this list's own scrolling, so the carousel's pull can be declared as the
  // gesture that decides before it. Inert on its own.
  const listGesture = useMemo(() => Gesture.Native(), [])
  const { bottom } = useSafeAreaInsets()
  const style = useMemo(() => getFlatListStyle(tab, openTab), [openTab, tab])
  const { theme } = useTheme()
  const carousel = useContext(DashboardCarouselContext)
  // The part of the header that never collapses. The list starts below it rather than
  // underneath, so its refresh spinner is not drawn behind the tabs.
  const stickyHeaderHeight = carousel ? carousel.headerHeight - carousel.collapsibleHeight : 0

  const carouselListStyle = useMemo(
    () => (carousel ? { marginTop: stickyHeaderHeight } : undefined),
    [carousel, stickyHeaderHeight]
  )

  const contentPaddingBottom = isMobile ? bottom || SPACING_SM : 0

  const contentContainerStyle = useMemo(() => {
    return [
      topSpacing,
      { flexGrow: 1 },
      isMobile && { paddingBottom: contentPaddingBottom },
      // A page with less content cannot scroll far enough to hold the header collapsed.
      // Padding would not do: flexGrow stretches the content box to the page anyway.
      !!carousel &&
        !!carousel.pageHeight && {
          minHeight: carousel.pageHeight - stickyHeaderHeight + carousel.collapsibleHeight
        },
      // Must come last, as it overrides the padding of the non-carousel layout. Only
      // the collapsing part of the header is padded for, the rest is above the list
      !!carousel && { paddingTop: carousel.collapsibleHeight }
    ]
  }, [carousel, contentPaddingBottom, stickyHeaderHeight, topSpacing])

  // iOS draws the scroll indicator against the frame, not the content, so padding the
  // content away from the banners leaves the indicator under them. Inset separately.
  const carouselIndicatorProps = useMemo(() => {
    if (!carousel) return NO_PROPS

    return {
      scrollIndicatorInsets: { top: carousel.collapsibleHeight },
      // Left on, iOS recomputes the insets off the safe area and drops the one above
      automaticallyAdjustsScrollIndicatorInsets: false
    }
  }, [carousel])

  // How tall the content is without the min height above, which the footer takes up by
  // stretching over whatever the items leave. The pages are pushed down by the open overview
  // rather than resized, so a page whose end that hides must scroll far enough to collapse it.
  const [contentHeight, setContentHeight] = useState(0)
  const [footerHeight, setFooterHeight] = useState(0)

  const onContentSizeChange = useCallback((_width: number, height: number) => {
    setContentHeight(height)
  }, [])

  const onFooterLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    setFooterHeight(nativeEvent.layout.height)
  }, [])

  const listHeight = carousel ? carousel.pageHeight - stickyHeaderHeight : 0
  const overviewHeight = carousel?.overviewHeight || 0
  const naturalContentHeight = contentHeight - footerHeight
  const isEndHiddenByOverview =
    !!overviewHeight && naturalContentHeight > listHeight - overviewHeight
  const collapseRoom = isEndHiddenByOverview
    ? Math.max(listHeight + overviewHeight - naturalContentHeight, 0)
    : 0

  const listFooter = useMemo(
    () =>
      carousel ? (
        <View style={{ flexGrow: 1, minHeight: collapseRoom }} onLayout={onFooterLayout} />
      ) : undefined,
    [carousel, collapseRoom, onFooterLayout]
  )

  // A page that fits below the open overview reports a content height too short to collapse
  // it, whatever the min height for the banners adds. Read from a ref, so the native scroll
  // listener isn't detached whenever the content changes.
  const overviewContentHeight = useRef(0)

  useEffect(() => {
    overviewContentHeight.current = naturalContentHeight + collapseRoom
  }, [collapseRoom, naturalContentHeight])

  const reportScrollOffset = carousel?.reportScrollOffset
  const onPageScroll = carousel?.onPageScroll

  // Where this page has got to, told to the carousel rather than asked for by it: the
  // shared value it keeps is what the header is collapsed by, which a page too short to
  // take the offset it was given never reaches - and the pull would then read the page
  // as scrolled while it sits at its top.
  const handleScrollListener = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      reportScrollOffset?.(event.nativeEvent.contentOffset.y)
      onPageScroll?.(event, overviewContentHeight.current)
      onScroll?.(event)
    },
    [onPageScroll, onScroll, reportScrollOffset]
  )

  // Bound to the value rather than the whole context, so measuring the header does not
  // detach the native scroll listener. Only the open page reports into it: the value is
  // shared, and a page too short to scroll as far would report the offset it stopped at
  // and win by coming last.
  const carouselScrollY = carousel?.scrollY
  const handleScroll = useMemo(() => {
    if (!carouselScrollY || openTab !== tab) return onScroll

    // The listener reads `overviewContentHeight` only when a scroll event arrives
    // eslint-disable-next-line react-hooks/refs
    return Animated.event([{ nativeEvent: { contentOffset: { y: carouselScrollY } } }], {
      useNativeDriver: true,
      listener: handleScrollListener
    })
  }, [carouselScrollY, handleScrollListener, onScroll, openTab, tab])

  // Resets the scroll position on a tab switch. The carousel does this itself for every
  // page, carrying over how far the banners are collapsed.
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

  // Lets the header and a swipe scroll this page: a drag on the header never reaches the
  // list under it, and a swipe has to take every page to the top.
  const registerPage = carousel?.registerPage

  const scrollToOffset = useCallback((offset: number) => {
    flatlistRef.current?.scrollToOffset({ offset, animated: false })
  }, [])

  useEffect(() => {
    if (!registerPage) return undefined

    registerPage(tab, { scrollToOffset, listGesture })

    return () => registerPage(tab, null)
  }, [listGesture, registerPage, scrollToOffset, tab])

  const registerFloatingBar = carousel?.registerFloatingBar

  useEffect(() => {
    if (!registerFloatingBar) return undefined

    registerFloatingBar(tab, floatingBar || null)

    return () => registerFloatingBar(tab, null)
  }, [floatingBar, registerFloatingBar, tab])

  const ListComponent = carousel ? AnimatedFlatList : FlatList

  const list = (
    <ListComponent
      ref={flatlistRef}
      style={[style, carouselListStyle]}
      contentContainerStyle={contentContainerStyle}
      // Makes the header sticky. The carousel lays its own header over the pages instead
      stickyHeaderIndices={carousel ? undefined : [1]}
      removeClippedSubviews
      // The carousel owns pulling past the top, so the page must not give at the top too
      bounces={!carousel}
      alwaysBounceVertical={!carousel}
      scrollEventThrottle={16}
      onScroll={handleScroll}
      // The carousel replaces it with a pull of its own, which unlike this one can be
      // asked to take a deliberate distance rather than the platform's short default.
      refreshControl={
        isMobile && !carousel ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={theme.iconPrimary}
            progressBackgroundColor={theme.secondaryBackground}
          />
        ) : undefined
      }
      ListFooterComponent={listFooter}
      ListFooterComponentStyle={carousel ? FOOTER_STYLE : undefined}
      onContentSizeChange={carousel ? onContentSizeChange : undefined}
      {...rest}
      {...(carousel ? CAROUSEL_VIRTUALIZATION : NO_PROPS)}
      {...carouselIndicatorProps}
    />
  )

  if (!carousel) return list

  return <GestureDetector gesture={listGesture}>{list}</GestureDetector>
}

export default React.memo(DashboardPageScrollContainer)
