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
import getCollapseThreshold from '@common/modules/dashboard/hooks/useCollapseOnScroll/getCollapseThreshold'
import spacings, { SPACING, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import DashboardCarouselContext, {
  DashboardFloatingBarProps
} from '../DashboardPagesCarousel/context'
import { TabType } from '../TabsAndSearch/Tabs/Tab/Tab'
import useListTopSpacing from './useListTopSpacing'

interface Props extends FlatListProps<any> {
  tab: TabType
  openTab: TabType
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

// The floating bar's 40px controls plus its vertical padding, and the SPACING it floats
// above the safe area at the bottom
const FLOATING_BAR_REACH = 40 + SPACING_TY * 2 + SPACING

// Stretches the footer over whatever the items leave of the content's min height
const FOOTER_STYLE: ViewStyle = { flexGrow: 1 }

const DashboardPageScrollContainer: FC<Props> = ({
  tab,
  openTab,
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
  // stretching over whatever the items leave. Kept in refs, as the content grows with every
  // batch the list renders while scrolled, and only `collapseRoom` changing is worth a render.
  const contentHeightRef = useRef(0)
  const footerHeightRef = useRef(0)
  const [collapseRoom, setCollapseRoom] = useState(0)
  // Read by the native scroll listener, so it isn't detached whenever the content changes
  const collapseThresholdRef = useRef(Infinity)

  const listHeight = carousel ? carousel.pageHeight - stickyHeaderHeight : 0
  const overviewHeight = carousel?.overviewHeight || 0
  const minContentHeight = carousel?.pageHeight ? listHeight + carousel.collapsibleHeight : 0
  const barReach = floatingBar ? FLOATING_BAR_REACH + bottom : 0

  const updateCollapseRoom = useCallback(() => {
    const next = getCollapseThreshold({
      contentHeight: contentHeightRef.current - footerHeightRef.current,
      paddingBottom: contentPaddingBottom,
      listHeight,
      minContentHeight,
      overviewHeight,
      barReach
    })

    collapseThresholdRef.current = next.collapseThreshold
    setCollapseRoom(next.collapseRoom)
  }, [barReach, contentPaddingBottom, listHeight, minContentHeight, overviewHeight])

  useEffect(() => {
    updateCollapseRoom()
  }, [updateCollapseRoom])

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      contentHeightRef.current = height
      updateCollapseRoom()
    },
    [updateCollapseRoom]
  )

  const onFooterLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => {
      footerHeightRef.current = nativeEvent.layout.height
      updateCollapseRoom()
    },
    [updateCollapseRoom]
  )

  const listFooter = useMemo(
    () =>
      carousel ? (
        <View style={{ flexGrow: 1, minHeight: collapseRoom }} onLayout={onFooterLayout} />
      ) : undefined,
    [carousel, collapseRoom, onFooterLayout]
  )

  const reportScrollOffset = carousel?.reportScrollOffset
  const onPageScroll = carousel?.onPageScroll

  // Where this page has got to, told to the carousel rather than asked for by it: the
  // shared value it keeps is what the header is collapsed by, which a page too short to
  // take the offset it was given never reaches - and the pull would then read the page
  // as scrolled while it sits at its top.
  const handleScrollListener = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      reportScrollOffset?.(event.nativeEvent.contentOffset.y)
      onPageScroll?.(event, collapseThresholdRef.current)
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

    // The listener reads `collapseThresholdRef` only when a scroll event arrives
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

    // The dashboard expands the overview itself once another tab is opened
    if (openTab === tab) flatlistRef.current?.scrollToOffset({ offset: 0, animated: false })
  }, [carousel, openTab, tab])

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
