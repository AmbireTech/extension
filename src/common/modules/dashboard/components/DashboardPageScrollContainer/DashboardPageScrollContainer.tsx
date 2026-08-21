import React, { FC, useContext, useEffect, useMemo, useRef } from 'react'
import { Animated, FlatList, FlatListProps, RefreshControl, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { isMobile } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings, { SPACING_SM } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'

import DashboardCarouselContext from '../DashboardPagesCarousel/context'
import { OVERVIEW_CONTENT_MAX_HEIGHT } from '../DashboardOverview/DashboardOverview'
import { TabType } from '../TabsAndSearch/Tabs/Tab/Tab'
import useListTopSpacing from './useListTopSpacing'

interface Props extends FlatListProps<any> {
  tab: TabType
  openTab: TabType
  animatedOverviewHeight: Animated.Value
  refreshing?: boolean
  onRefresh?: () => void
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

const DashboardPageScrollContainer: FC<Props> = ({
  tab,
  openTab,
  animatedOverviewHeight,
  refreshing,
  onRefresh,
  onScroll,
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
      // Must come last, as it overrides the padding of the non-carousel layout
      !!carousel && { paddingTop: carousel.headerHeight }
    ]
  }, [bottom, carousel, topSpacing])

  // Bound to the value and not to the whole context, so measuring the header
  // doesn't detach and reattach the native scroll listener. Mobile passes no
  // onScroll, which leaves the offset to be mapped natively with no JS listener.
  const carouselScrollY = carousel?.scrollY
  const handleScroll = useMemo(() => {
    if (!carouselScrollY) return onScroll

    return Animated.event(
      [{ nativeEvent: { contentOffset: { y: carouselScrollY } } }],
      onScroll ? { useNativeDriver: true, listener: onScroll } : { useNativeDriver: true }
    )
  }, [carouselScrollY, onScroll])

  // Reset scroll position when switching tabs (new)
  useEffect(() => {
    if (!flatlistRef.current) return

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
  }, [animatedOverviewHeight, openTab, tab])

  // A swipe resets every page, not only the open one, because any of them can be
  // the one the swipe lands on.
  const carouselResetToken = carousel?.resetToken

  useEffect(() => {
    if (carouselResetToken === undefined) return

    flatlistRef.current?.scrollToOffset({ offset: 0, animated: false })
  }, [carouselResetToken])

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
    />
  )
}

export default React.memo(DashboardPageScrollContainer)
