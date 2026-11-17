import React, { useCallback, useContext, useEffect, useState } from 'react'
import { LayoutChangeEvent, View } from 'react-native'
import { useModalize } from 'react-native-modalize'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import GasTankModal from '@common/components/GasTankModal'
import { ControllersStateLoadedContext } from '@common/contexts/controllersStateLoadedContext'
import { useIsScreenSettled } from '@common/contexts/screenFocusContext'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useTheme from '@common/hooks/useTheme'
import DashboardOverview from '@common/modules/dashboard/components/DashboardOverview'
import DashboardPages from '@common/modules/dashboard/components/DashboardPages'
import type { OverviewCollapse } from '@common/modules/dashboard/components/DashboardPagesCarousel/DashboardPagesCarousel'
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
  // The pager starts where the collapsed overview ends and slides over the part that
  // collapses, so a collapse never resizes or redraws anything. Both heights are static.
  const [overviewHeight, setOverviewHeight] = useState(0)
  const [collapsibleOverviewHeight, setCollapsibleOverviewHeight] = useState(0)

  const onOverviewLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    setOverviewHeight(nativeEvent.layout.height)
  }, [])
  // Until then the pager doesn't know where to start, and would be drawn over the overview
  const isOverviewMeasured = !!overviewHeight && !!collapsibleOverviewHeight
  // How far the pager has slid over the overview, which moves its background in step
  const [overviewCollapse, setOverviewCollapse] = useState<OverviewCollapse>()

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
        <View
          style={[styles.container, { paddingTop: isShowingRealTree ? 0 : overviewPaddingTop }]}
        >
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
              {/* Rendered before the pager, which has to be drawn over it */}
              <View
                style={[styles.overviewOverlay, { paddingTop: overviewPaddingTop }]}
                onLayout={onOverviewLayout}
              >
                <DashboardOverview
                  openGasTankModal={openGasTankModal}
                  onCollapsibleHeightChange={setCollapsibleOverviewHeight}
                  overviewCollapse={overviewCollapse}
                />
              </View>
              <View
                style={[
                  flexbox.flex1,
                  {
                    marginTop: overviewHeight - collapsibleOverviewHeight,
                    opacity: isOverviewMeasured ? 1 : 0
                  }
                ]}
                pointerEvents="box-none"
              >
                <DashboardPages
                  onRefresh={reloadAccount}
                  refreshing={isManuallyRefreshing}
                  overviewHeight={collapsibleOverviewHeight}
                  onOverviewCollapseChange={setOverviewCollapse}
                />
              </View>
            </>
          )}
        </View>
      </View>
    </MobileLayoutContainer>
  )
}

export default React.memo(DashboardScreen)
