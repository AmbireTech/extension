import React, { useCallback, useRef, useState } from 'react'
import { Animated, NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import GasTankModal from '@common/components/GasTankModal'
import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'
import useTheme from '@common/hooks/useTheme'
import DashboardOverview from '@common/modules/dashboard/components/DashboardOverview'
import { OVERVIEW_CONTENT_MAX_HEIGHT } from '@common/modules/dashboard/components/DashboardOverview/DashboardOverview'
import DashboardPages from '@common/modules/dashboard/components/DashboardPages'
import PendingActionWindowModal from '@common/modules/dashboard/components/PendingActionWindowModal'
import useDashboardReload from '@common/modules/dashboard/hooks/useDashobardReload'
import getStyles from '@common/modules/dashboard/screens/styles' // Keeping styles in common
import flexbox from '@common/styles/utils/flexbox'
import { MobileLayoutContainer } from '@mobile/components/MobileLayoutWrapper'

const DashboardScreen = () => {
  const { styles } = useTheme(getStyles)
  const { ref: gasTankModalRef, open: openGasTankModal, close: closeGasTankModal } = useModalize()
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

  const { reloadAccount, refreshing } = useDashboardReload()

  const isOverviewExpandedRef = useRef(true)

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      return // TODO: fix behavior on mobile
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

      if (isOverviewExpandedRef.current !== isOverviewExpanded) {
        isOverviewExpandedRef.current = isOverviewExpanded
        Animated.spring(animatedOverviewHeight, {
          toValue: isOverviewExpanded ? OVERVIEW_CONTENT_MAX_HEIGHT : 0,
          bounciness: 0,
          speed: 2.8,
          overshootClamping: true,
          useNativeDriver: false // maxHeight/padding do not support native driver
        }).start()
      }
    },
    [animatedOverviewHeight, dashboardOverviewSize.height, lastOffsetY, scrollUpStartedAt]
  )

  if (!account) return null

  return (
    <MobileLayoutContainer
      withHorizontalPadding={false}
      withTopPadding={false}
      withBottomInset={false}
    >
      <View style={flexbox.flex1}>
        <GasTankModal
          modalRef={gasTankModalRef}
          handleClose={closeGasTankModal}
          portfolio={portfolio}
          account={account}
        />
        <PendingActionWindowModal />
        <View style={styles.container}>
          <DashboardOverview
            openGasTankModal={openGasTankModal}
            animatedOverviewHeight={animatedOverviewHeight}
            dashboardOverviewSize={debouncedDashboardOverviewSize}
            setDashboardOverviewSize={setDashboardOverviewSize}
          />
          <DashboardPages
            onScroll={onScroll}
            animatedOverviewHeight={animatedOverviewHeight}
            isSearchHidden={isSearchHidden}
            onRefresh={reloadAccount}
            refreshing={refreshing}
          />
        </View>
      </View>
    </MobileLayoutContainer>
  )
}

export default React.memo(DashboardScreen)
