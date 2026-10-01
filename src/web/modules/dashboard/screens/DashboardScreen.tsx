import React, { useContext, useEffect, useRef, useState } from 'react'
import { Animated, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import GasTankModal from '@common/components/GasTankModal'
import LayoutWrapper from '@common/components/LayoutWrapper'
import { ControllersStateLoadedContext } from '@common/contexts/controllersStateLoadedContext'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import DashboardOverview from '@common/modules/dashboard/components/DashboardOverview'
import { OVERVIEW_CONTENT_MAX_HEIGHT } from '@common/modules/dashboard/components/DashboardOverview/DashboardOverview'
import DashboardPages from '@common/modules/dashboard/components/DashboardPages'
import DashboardShell from '@common/modules/dashboard/components/DashboardShell'
import PendingActionWindowModal from '@common/modules/dashboard/components/PendingActionWindowModal'
import useCollapseOnScroll from '@common/modules/dashboard/hooks/useCollapseOnScroll'
import getStyles from '@common/modules/dashboard/screens/styles'
import MobileAppPromoBanner from '@web/modules/dashboard/components/MobileAppPromoBanner'
import commonWebStyles from '@web/styles/utils/common'

const DashboardScreen = () => {
  const { styles } = useTheme(getStyles)
  const { ref: gasTankModalRef, open: openGasTankModal, close: closeGasTankModal } = useModalize()
  const [dashboardOverviewSize, setDashboardOverviewSize] = useState({
    width: 0,
    height: 0
  })
  const animatedOverviewHeight = useRef(new Animated.Value(OVERVIEW_CONTENT_MAX_HEIGHT)).current

  const {
    state: { account, portfolio }
  } = useController('SelectedAccountController')
  // The splash hides as soon as the account is known, but the full dashboard reads
  // many deferred controllers (keystore, requests, portfolio, banners, ...). Until
  // they all arrive, render a lightweight shell (real header, menu buttons and
  // skeletons); mount the full dashboard only once every controller is ready.
  const { areAllControllerStatesLoaded } = useContext(ControllersStateLoadedContext)

  const { isOverviewCollapsed, isFloatingBarHidden, onScroll, reset } = useCollapseOnScroll(
    dashboardOverviewSize.height,
    OVERVIEW_CONTENT_MAX_HEIGHT
  )

  useEffect(() => {
    Animated.spring(animatedOverviewHeight, {
      toValue: isOverviewCollapsed ? 0 : OVERVIEW_CONTENT_MAX_HEIGHT,
      bounciness: 0,
      speed: 2.8,
      overshootClamping: true,
      useNativeDriver: false
    }).start()
  }, [animatedOverviewHeight, isOverviewCollapsed])

  return (
    <LayoutWrapper>
      {!areAllControllerStatesLoaded ? (
        <View style={styles.container}>
          <DashboardShell contentContainerStyle={commonWebStyles.contentContainer} />
        </View>
      ) : (
        <>
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
              setDashboardOverviewSize={setDashboardOverviewSize}
            />
            <DashboardPages
              onScroll={onScroll}
              isSearchHidden={isFloatingBarHidden}
              onTabChange={reset}
            />
            <MobileAppPromoBanner />
          </View>
        </>
      )}
    </LayoutWrapper>
  )
}

export default React.memo(DashboardScreen)
