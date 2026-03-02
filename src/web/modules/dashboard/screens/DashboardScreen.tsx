import React, { useCallback, useRef, useState } from 'react'
import { Animated, NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import GasTankModal from '@common/components/GasTankModal'
import LayoutWrapper from '@common/components/LayoutWrapper'
import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'
import useTheme from '@common/hooks/useTheme'
import DashboardOverview from '@common/modules/dashboard/components/DashboardOverview'
import { OVERVIEW_CONTENT_MAX_HEIGHT } from '@common/modules/dashboard/components/DashboardOverview/DashboardOverview'
import DashboardPages from '@common/modules/dashboard/components/DashboardPages'
import PendingActionWindowModal from '@common/modules/dashboard/components/PendingActionWindowModal'
import getStyles from '@common/modules/dashboard/screens/styles'
import { getUiType } from '@common/utils/uiType'

const { isPopup } = getUiType()

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

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isPopup) return

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

      // The user has to scroll down the height of the overview container in order make it smaller.
      // This is done, because hiding the overview will subtract the height of the overview from the height of the
      // scroll view, thus a shorter scroll container may no longer be scrollable after hiding the overview
      // and if that happens, the user will not be able to scroll up to expand the overview again.
      const scrollDownThreshold = dashboardOverviewSize.height / 2
      // scrollUpThreshold must be a constant value and not dependent on the height of the overview,
      // because the height will change as the overview animates from small to large.
      const scrollUpThreshold = 200
      const isOverviewExpanded =
        y < scrollDownThreshold ||
        y < scrollUpStartedAt.current - scrollUpThreshold ||
        // Don't allow the overview to expand if the content is not tall enough to be scrollable
        // after the collapse
        contentHeight < OVERVIEW_CONTENT_MAX_HEIGHT * 2
      const isSearchHidden = y > 50 && y > scrollUpStartedAt.current - scrollUpThreshold

      setIsSearchHidden(isSearchHidden)
      Animated.spring(animatedOverviewHeight, {
        toValue: isOverviewExpanded ? OVERVIEW_CONTENT_MAX_HEIGHT : 0,
        bounciness: 0,
        speed: 2.8,
        overshootClamping: true,
        useNativeDriver: false
      }).start()
    },
    [animatedOverviewHeight, dashboardOverviewSize.height, lastOffsetY, scrollUpStartedAt]
  )

  return (
    <LayoutWrapper>
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
        />
      </View>
    </LayoutWrapper>
  )
}

export default React.memo(DashboardScreen)
