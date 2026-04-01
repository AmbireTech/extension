import React, { FC, useEffect, useMemo, useRef } from 'react'
import { Animated, FlatList, FlatListProps, RefreshControl, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { isMobile, isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'

import useBanners from '../../hooks/useBanners'
import { OVERVIEW_CONTENT_MAX_HEIGHT } from '../DashboardOverview/DashboardOverview'
import { TabType } from '../TabsAndSearch/Tabs/Tab/Tab'

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

const getFlatListStyle = (tab: TabType, openTab: TabType) => [
  spacings.phSm,
  openTab !== tab ? HIDDEN_STYLE : {}
]

const DashboardPageScrollContainer: FC<Props> = ({
  tab,
  openTab,
  animatedOverviewHeight,
  refreshing,
  onRefresh,
  ...rest
}) => {
  const [controllerBanners] = useBanners()
  const flatlistRef = useRef<FlatList | null>(null)
  const { bottom } = useSafeAreaInsets()
  const style = useMemo(() => getFlatListStyle(tab, openTab), [openTab, tab])
  const { theme } = useTheme()
  const contentContainerStyle = useMemo(() => {
    return [
      controllerBanners.length && isWeb ? spacings.ptTy : spacings.pt0,
      { flexGrow: 1 },
      isMobile && { paddingBottom: bottom }
    ]
  }, [bottom, controllerBanners.length])

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

  return (
    <FlatList
      ref={flatlistRef}
      style={style}
      contentContainerStyle={contentContainerStyle}
      stickyHeaderIndices={[1]} // Makes the header sticky
      removeClippedSubviews
      bounces
      alwaysBounceVertical
      scrollEventThrottle={16}
      refreshControl={
        isMobile ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={theme.iconPrimary}
            progressBackgroundColor={theme.secondaryBackground}
          />
        ) : undefined
      }
      {...rest}
    />
  )
}

export default DashboardPageScrollContainer
