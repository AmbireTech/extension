import React, { useCallback, useRef, useState } from 'react'
import { Animated, NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { isWeb } from '@common/config/env'
import useRoute from '@common/hooks/useRoute'
import useTheme from '@common/hooks/useTheme'
import useWindowSize from '@common/hooks/useWindowSize'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import ReceiveModal from '@web/components/ReceiveModal'
import usePortfolioControllerState from '@web/hooks/usePortfolioControllerState/usePortfolioControllerState'
import { getUiType } from '@web/utils/uiType'

import DAppFooter from '../components/DAppFooter'
import DashboardOverview from '../components/DashboardOverview'
import DashboardPages from '../components/DashboardPages'
import getStyles from './styles'

const { isPopup, isTab } = getUiType()

export const OVERVIEW_CONTENT_MAX_HEIGHT = 120

const DashboardScreen = () => {
  const route = useRoute()
  const { styles } = useTheme(getStyles)
  const { minWidthSize } = useWindowSize()
  const { accountPortfolio, state } = usePortfolioControllerState()
  const { ref: receiveModalRef, open: openReceiveModal, close: closeReceiveModal } = useModalize()
  const [lastOffsetY, setLastOffsetY] = useState(0)
  const [scrollUpStartedAt, setScrollUpStartedAt] = useState(0)
  const [dashboardOverviewSize, setDashboardOverviewSize] = useState({
    width: 0,
    height: 0
  })
  const animatedOverviewHeight = useRef(new Animated.Value(OVERVIEW_CONTENT_MAX_HEIGHT)).current

  const filterByNetworkId = route?.state?.filterByNetworkId || null

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isPopup) return

      const {
        contentOffset: { y }
      } = event.nativeEvent

      if (scrollUpStartedAt === 0 && lastOffsetY > y) {
        setScrollUpStartedAt(y)
      } else if (scrollUpStartedAt > 0 && y > lastOffsetY) {
        setScrollUpStartedAt(0)
      }
      setLastOffsetY(y)

      // The user has to scroll down the height of the overview container in order make it smaller.
      // This is done, because hiding the overview will subtract the height of the overview from the height of the
      // scroll view, thus a shorter scroll container may no longer be scrollable after hiding the overview
      // and if that happens, the user will not be able to scroll up to expand the overview again.
      const scrollDownThreshold = dashboardOverviewSize.height + 20
      // scrollUpThreshold must be a constant value and not dependent on the height of the overview,
      // because the height will change as the overview animates from small to large.
      const scrollUpThreshold = 200
      const isOverviewExpanded =
        y < scrollDownThreshold || y < scrollUpStartedAt - scrollUpThreshold

      Animated.spring(animatedOverviewHeight, {
        toValue: isOverviewExpanded ? OVERVIEW_CONTENT_MAX_HEIGHT : 0,
        bounciness: 0,
        speed: 2.8,
        overshootClamping: true,
        useNativeDriver: !isWeb
      }).start()
    },
    [animatedOverviewHeight, dashboardOverviewSize.height, lastOffsetY, scrollUpStartedAt]
  )

  return (
    <>
      <ReceiveModal modalRef={receiveModalRef} handleClose={closeReceiveModal} />
      <View style={styles.container}>
        <View style={[flexbox.flex1, isTab && minWidthSize('l') && spacings.phSm]}>
          <DashboardOverview
            openReceiveModal={openReceiveModal}
            animatedOverviewHeight={animatedOverviewHeight}
            dashboardOverviewSize={dashboardOverviewSize}
            setDashboardOverviewSize={setDashboardOverviewSize}
          />
          <DashboardPages
            accountPortfolio={accountPortfolio}
            tokenPreferences={state?.tokenPreferences}
            filterByNetworkId={filterByNetworkId}
            onScroll={onScroll}
          />
        </View>
        {!!isPopup && <DAppFooter />}
      </View>
    </>
  )
}

export default React.memo(DashboardScreen)
