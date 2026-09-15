import React, { useContext, useEffect, useRef, useState } from 'react'
import { Animated, View } from 'react-native'
import { useModalize } from 'react-native-modalize'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import GasTankModal from '@common/components/GasTankModal'
import { ControllersStateLoadedContext } from '@common/contexts/controllersStateLoadedContext'
import { useIsScreenSettled } from '@common/contexts/screenFocusContext'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useDebounce from '@common/hooks/useDebounce'
import useTheme from '@common/hooks/useTheme'
import DashboardOverview from '@common/modules/dashboard/components/DashboardOverview'
import { OVERVIEW_CONTENT_MAX_HEIGHT } from '@common/modules/dashboard/components/DashboardOverview/DashboardOverview'
import DashboardPages from '@common/modules/dashboard/components/DashboardPages'
import DashboardShell from '@common/modules/dashboard/components/DashboardShell'
import PendingActionWindowModal from '@common/modules/dashboard/components/PendingActionWindowModal'
import useDashboardReload from '@common/modules/dashboard/hooks/useDashboardReload'
import getStyles from '@common/modules/dashboard/screens/styles' // Keeping styles in common
import { SPACING_MI, SPACING_SM, SPACING_XL } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { MobileLayoutContainer } from '@mobile/components/MobileLayoutWrapper'

const DashboardScreen = () => {
  const { styles } = useTheme(getStyles)
  const { ref: gasTankModalRef, open: openGasTankModal, close: closeGasTankModal } = useModalize()
  const [dashboardOverviewSize, setDashboardOverviewSize] = useState({
    width: 0,
    height: 0
  })
  const debouncedDashboardOverviewSize = useDebounce({ value: dashboardOverviewSize, delay: 100 })
  // The overview doesn't collapse on scroll on mobile, so this stays at its max.
  // It is still needed, as the pages animate it back open when a tab is opened.
  const animatedOverviewHeight = useRef(new Animated.Value(OVERVIEW_CONTENT_MAX_HEIGHT)).current

  const {
    state: { account, portfolio }
  } = useController('SelectedAccountController')

  const { reloadAccount, isManuallyRefreshing } = useDashboardReload()
  const { top: safeTop } = useSafeAreaInsets()
  // Devices with a notch/dynamic island already reserve a gap below it within the
  // top inset, so the full top padding would make the space above the overview
  // visibly larger than the horizontal one. Devices without a notch get no such
  // gap, so there the padding is kept in full.
  const overviewPaddingTop = safeTop > SPACING_XL ? SPACING_MI : SPACING_SM

  const { areAllControllerStatesLoaded } = useContext(ControllersStateLoadedContext)
  const { dispatch } = useControllersMiddleware()
  const isScreenSettled = useIsScreenSettled()

  const isShowingRealTree = !!account && areAllControllerStatesLoaded

  // Don't move this out of here - this logic is very finnicky and depends on StackScreen,
  // the unlock blocking the CPU and the portfolio taking a huge chunk of the CPU's attention.
  useEffect(() => {
    if (!portfolio?.isAllReady || !isScreenSettled || !isShowingRealTree) return

    dispatch({ type: 'INIT_DEFERRED_CONTROLLERS' })
  }, [portfolio?.isAllReady, isScreenSettled, isShowingRealTree, dispatch])

  if (!account) return null

  return (
    <MobileLayoutContainer
      withHorizontalPadding={false}
      withTopPadding={false}
      keyboardAwareFooter={false}
    >
      <View style={flexbox.flex1}>
        <View style={[styles.container, { paddingTop: overviewPaddingTop }]}>
          {!isShowingRealTree ? (
            <DashboardShell />
          ) : (
            <>
              <GasTankModal
                modalRef={gasTankModalRef}
                handleClose={closeGasTankModal}
                portfolio={portfolio}
                account={account}
              />
              <PendingActionWindowModal />
              <DashboardOverview
                openGasTankModal={openGasTankModal}
                animatedOverviewHeight={animatedOverviewHeight}
                dashboardOverviewSize={debouncedDashboardOverviewSize}
                setDashboardOverviewSize={setDashboardOverviewSize}
              />
              <DashboardPages
                animatedOverviewHeight={animatedOverviewHeight}
                onRefresh={reloadAccount}
                refreshing={isManuallyRefreshing}
              />
            </>
          )}
        </View>
      </View>
    </MobileLayoutContainer>
  )
}

export default React.memo(DashboardScreen)
