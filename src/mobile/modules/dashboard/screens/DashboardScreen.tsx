import React, { useCallback, useRef, useState } from 'react'
import { Animated, NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native'

import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'
import useTheme from '@common/hooks/useTheme'
import DashboardOverview from '@common/modules/dashboard/components/DashboardOverview'
import DashboardPages from '@common/modules/dashboard/components/DashboardPages'
import PendingActionWindowModal from '@common/modules/dashboard/components/PendingActionWindowModal'
import getStyles from '@common/modules/dashboard/screens/styles' // Keeping styles in common

export const OVERVIEW_CONTENT_MAX_HEIGHT = 280

const DashboardScreen = () => {
  const { styles } = useTheme(getStyles)
  const lastOffsetY = useRef(0)
  const scrollUpStartedAt = useRef(0)
  const [dashboardOverviewSize, setDashboardOverviewSize] = useState({
    width: 0,
    height: 0
  })
  const debouncedDashboardOverviewSize = useDebounce({ value: dashboardOverviewSize, delay: 100 })
  const animatedOverviewHeight = useRef(new Animated.Value(OVERVIEW_CONTENT_MAX_HEIGHT)).current
  const [isSearchHidden, setIsSearchHidden] = useState(false)

  const {
    state: { account, portfolio }
  } = useController('SelectedAccountController')

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      // Mobile does not have isPopup, so we handle it similarly.
      const {
        contentOffset: { y },
        contentSize: { height: contentHeight }
      } = event.nativeEvent

      if (scrollUpStartedAt.current === 0 && lastOffsetY.current > y) {
        scrollUpStartedAt.current = y
      } else if (scrollUpStartedAt.current > 0 && y > lastOffsetY.current) {
        scrollUpStartedAt.current = 0
      }
      lastOffsetY.current = y

      const scrollDownThreshold = dashboardOverviewSize.height / 2
      const scrollUpThreshold = 200
      const isOverviewExpanded =
        y < scrollDownThreshold ||
        y < scrollUpStartedAt.current - scrollUpThreshold ||
        contentHeight < OVERVIEW_CONTENT_MAX_HEIGHT * 2
      const isSearchHiddenVal = y > 50 && y > scrollUpStartedAt.current - scrollUpThreshold

      setIsSearchHidden(isSearchHiddenVal)
      Animated.spring(animatedOverviewHeight, {
        toValue: isOverviewExpanded ? OVERVIEW_CONTENT_MAX_HEIGHT : 0,
        bounciness: 0,
        speed: 2.8,
        overshootClamping: true,
        useNativeDriver: true
      }).start()
    },
    [animatedOverviewHeight, dashboardOverviewSize.height, lastOffsetY, scrollUpStartedAt]
  )

  if (!account) return null

  return (
    <>
      <PendingActionWindowModal />
      <View style={styles.container}>
        <DashboardOverview
          animatedOverviewHeight={animatedOverviewHeight}
          dashboardOverviewSize={debouncedDashboardOverviewSize}
          setDashboardOverviewSize={setDashboardOverviewSize}
        />
        <DashboardPages
          onScroll={onScroll}
          animatedOverviewHeight={animatedOverviewHeight}
          isSearchHidden={isSearchHidden}
        />
      </View>
    </>
  )
}

export default React.memo(DashboardScreen)
