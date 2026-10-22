import React, { FC, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  FlatListProps,
  LayoutChangeEvent,
  RefreshControl,
  View,
  ViewStyle
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { isMobile, isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import getCanCollapseOverview from '@common/modules/dashboard/helpers/getCanCollapseOverview'
import { WEB_OVERVIEW_COLLAPSE_START_DISTANCE } from '@common/modules/dashboard/helpers/overviewCollapse'
import spacings, { SPACING, SPACING_SM, SPACING_TY } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import DashboardCarouselContext, {
  DashboardFloatingBarProps
} from '../DashboardPagesCarousel/context'
import { TabType } from '../TabsAndSearch/Tabs/Tab/Tab'
import useCarouselList from './useCarouselList'
import useListTopSpacing from './useListTopSpacing'

interface Props extends FlatListProps<any> {
  tab: TabType
  openTab: TabType
  refreshing?: boolean
  onRefresh?: () => void
  /** What the page wants in the bar the carousel renders above the pager. */
  floatingBar?: DashboardFloatingBarProps
}

// Every page is a slide of the dashboard carousel, so they are all laid out next to each
// other instead of only the open one being visible.
const LIST_STYLE = [spacings.phSm, flexbox.flex1]

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

  // How tall the content is without the min height below, which the footer takes up by
  // stretching over whatever the items leave. Kept in refs, as the content grows with every
  // batch the list renders while scrolled, and only `canCollapseOverview` changing is worth a render.
  const contentHeightRef = useRef(0)
  const footerHeightRef = useRef(0)
  const [canCollapseOverview, setCanCollapseOverview] = useState(false)

  const listHeight = carousel ? carousel.pageHeight - stickyHeaderHeight : 0
  const bannersHeight = carousel?.collapsibleHeight || 0
  const overviewHeight = carousel?.overviewHeight || 0
  const minContentHeight = carousel?.pageHeight ? listHeight + bannersHeight : 0
  const barReach = floatingBar ? FLOATING_BAR_REACH + bottom : 0

  // Mobile holds the lists in place as the pager slides over the overview, so they are padded
  // by it. Web moves them with the pager instead, see `useWebCarouselStyles`
  const overviewPadding = isWeb ? 0 : overviewHeight
  // How far past the banners a page has to scroll to collapse the overview. Mobile collapses it
  // with the offset, so by its whole height; web all at once, a few pixels past the banners
  const overviewCollapseRange = isWeb ? WEB_OVERVIEW_COLLAPSE_START_DISTANCE + 1 : overviewHeight

  const updateCanCollapseOverview = useCallback(() => {
    setCanCollapseOverview(
      getCanCollapseOverview({
        // On web, the open overview pushes the list's end down out of view by as much as the
        // padding hides of it on mobile
        contentHeight:
          contentHeightRef.current - footerHeightRef.current + overviewHeight - overviewPadding,
        paddingBottom: contentPaddingBottom,
        listHeight,
        minContentHeight,
        bannersHeight,
        overviewHeight,
        barReach
      })
    )
  }, [
    bannersHeight,
    barReach,
    contentPaddingBottom,
    listHeight,
    minContentHeight,
    overviewHeight,
    overviewPadding
  ])

  useEffect(() => {
    updateCanCollapseOverview()
  }, [updateCanCollapseOverview])

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      contentHeightRef.current = height
      updateCanCollapseOverview()
    },
    [updateCanCollapseOverview]
  )

  const onFooterLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => {
      footerHeightRef.current = nativeEvent.layout.height
      updateCanCollapseOverview()
    },
    [updateCanCollapseOverview]
  )

  const listFooter = useMemo(
    () => (carousel ? <View style={FOOTER_STYLE} onLayout={onFooterLayout} /> : undefined),
    [carousel, onFooterLayout]
  )

  const contentContainerStyle = useMemo(() => {
    return [
      topSpacing,
      { flexGrow: 1 },
      isMobile && { paddingBottom: contentPaddingBottom },
      // A page with less content cannot scroll far enough to hold the header collapsed, nor
      // the overview, if its end is hidden without collapsing it. A page whose end shows
      // never scrolls the overview. Padding would not do: flexGrow stretches the content anyway.
      !!minContentHeight && {
        minHeight: minContentHeight + (canCollapseOverview ? overviewCollapseRange : 0)
      },
      // Must come last, as it overrides the padding of the non-carousel layout. Only the
      // collapsing parts of the header and the overview are padded for, the rest is above the list
      !!carousel && { paddingTop: bannersHeight + overviewPadding }
    ]
  }, [
    bannersHeight,
    canCollapseOverview,
    carousel,
    contentPaddingBottom,
    minContentHeight,
    overviewCollapseRange,
    overviewPadding,
    topSpacing
  ])

  // iOS draws the scroll indicator against the frame, not the content, so padding the
  // content away from the banners leaves the indicator under them. Inset separately.
  const carouselIndicatorProps = useMemo(() => {
    if (!carousel) return NO_PROPS

    return {
      scrollIndicatorInsets: { top: carousel.collapsibleHeight + carousel.overviewHeight },
      // Left on, iOS recomputes the insets off the safe area and drops the one above
      automaticallyAdjustsScrollIndicatorInsets: false
    }
  }, [carousel])

  // Where this page has got to, told to the carousel rather than asked for by it: the
  // offset it keeps is what the header is collapsed by, which a page too short to take the
  // offset it was given never reaches - and the pull would then read the page as scrolled
  // while it sits at its top. Only the open page reports: the offset is shared, and a page
  // too short to scroll as far would report the offset it stopped at and win by coming last.
  // Bound to the value rather than the whole context, so measuring the header does not
  // detach the native scroll listener.
  const {
    ListComponent,
    ref: listRef,
    onScroll: handleScroll,
    onMomentumScrollEnd
  } = useCarouselList({
    listRef: flatlistRef,
    scrollY: carousel?.scrollY,
    pageScroll: carousel?.pageScroll,
    isOpen: openTab === tab,
    onScroll
  })

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

  const scrollToOffset = useCallback((offset: number, animated = false) => {
    flatlistRef.current?.scrollToOffset({ offset, animated })
  }, [])

  // Web only, by the list's own scrollable node, so a wheel turned over the header scrolls
  // the page as smoothly as one turned over the page itself
  const scrollBy = useCallback((delta: number) => {
    const node = flatlistRef.current?.getScrollableNode() as HTMLElement | null | undefined

    node?.scrollBy?.(0, delta)
  }, [])

  useEffect(() => {
    if (!registerPage) return undefined

    registerPage(tab, { scrollToOffset, scrollBy, listGesture })

    return () => registerPage(tab, null)
  }, [listGesture, registerPage, scrollBy, scrollToOffset, tab])

  const registerFloatingBar = carousel?.registerFloatingBar

  useEffect(() => {
    if (!registerFloatingBar) return undefined

    registerFloatingBar(tab, floatingBar || null)

    return () => registerFloatingBar(tab, null)
  }, [floatingBar, registerFloatingBar, tab])

  const list = (
    <ListComponent
      ref={listRef}
      style={[LIST_STYLE, carouselListStyle]}
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
      onMomentumScrollEnd={onMomentumScrollEnd}
      {...rest}
      {...(carousel ? CAROUSEL_VIRTUALIZATION : NO_PROPS)}
      {...carouselIndicatorProps}
    />
  )

  // Web has no pull to refresh to declare the list's scrolling against
  if (!carousel || isWeb) return list

  return <GestureDetector gesture={listGesture}>{list}</GestureDetector>
}

export default React.memo(DashboardPageScrollContainer)
