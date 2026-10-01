import React, { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Animated, LayoutChangeEvent, View } from 'react-native'
import { useModalize } from 'react-native-modalize'
import { useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import GasTankModal from '@common/components/GasTankModal'
import { ControllersStateLoadedContext } from '@common/contexts/controllersStateLoadedContext'
import { useIsScreenSettled } from '@common/contexts/screenFocusContext'
import useController from '@common/hooks/useController'
import useControllersMiddleware from '@common/hooks/useControllersMiddleware'
import useTheme from '@common/hooks/useTheme'
import DashboardOverview from '@common/modules/dashboard/components/DashboardOverview'
import { OVERVIEW_CONTENT_MAX_HEIGHT } from '@common/modules/dashboard/components/DashboardOverview/DashboardOverview'
import type { OverviewCollapsibleLayout } from '@common/modules/dashboard/components/DashboardOverview/OverviewCollapsible/OverviewCollapsible'
import DashboardPages from '@common/modules/dashboard/components/DashboardPages'
import DashboardShell from '@common/modules/dashboard/components/DashboardShell'
import PendingActionWindowModal from '@common/modules/dashboard/components/PendingActionWindowModal'
import useDashboardReload from '@common/modules/dashboard/hooks/useDashboardReload'
import getStyles from '@common/modules/dashboard/screens/styles' // Keeping styles in common
import { SPACING_MI, SPACING_SM, SPACING_XL } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import { MobileLayoutContainer } from '@mobile/components/MobileLayoutWrapper'

const UNMEASURED_OVERVIEW_SIZE = { width: 0, height: 0 }
const NOOP = () => {}

const DashboardScreen = () => {
  const { styles } = useTheme(getStyles)
  const { ref: gasTankModalRef, open: openGasTankModal, close: closeGasTankModal } = useModalize()
  // Only web collapses the overview through this, so it stays at its max on mobile.
  // It is still needed, as the pages animate it back open when a tab is opened.
  const animatedOverviewHeight = useRef(new Animated.Value(OVERVIEW_CONTENT_MAX_HEIGHT)).current

  // The overview is laid over the pager, which starts where the collapsed overview ends and
  // is pushed down by the open one with a transform, so a collapse doesn't resize the pages.
  const overviewExpansion = useSharedValue(1)
  const [overviewHeight, setOverviewHeight] = useState(0)
  const [collapsedOverviewHeight, setCollapsedOverviewHeight] = useState(0)
  const overviewLayout = useRef({ overlayHeight: 0, collapsibleHeight: 0 })

  // Both heights change every frame of a collapse, but their difference doesn't, so this
  // only re-renders when the part that never collapses changes
  const updateCollapsedOverviewHeight = useCallback(() => {
    const { overlayHeight, collapsibleHeight } = overviewLayout.current

    setCollapsedOverviewHeight(Math.round(overlayHeight - collapsibleHeight))
  }, [])

  const onOverviewLayout = useCallback(
    ({ nativeEvent }: LayoutChangeEvent) => {
      overviewLayout.current.overlayHeight = nativeEvent.layout.height
      updateCollapsedOverviewHeight()
    },
    [updateCollapsedOverviewHeight]
  )

  const onCollapsibleLayoutChange = useCallback(
    ({ height, expandedHeight }: OverviewCollapsibleLayout) => {
      overviewLayout.current.collapsibleHeight = height
      setOverviewHeight(Math.round(expandedHeight))
      updateCollapsedOverviewHeight()
    },
    [updateCollapsedOverviewHeight]
  )

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
              <View style={[flexbox.flex1, { marginTop: collapsedOverviewHeight }]}>
                <DashboardPages
                  animatedOverviewHeight={animatedOverviewHeight}
                  onRefresh={reloadAccount}
                  refreshing={isManuallyRefreshing}
                  overviewExpansion={overviewExpansion}
                  overviewHeight={overviewHeight}
                />
              </View>
              {/* Rendered after the pager, because zIndex alone is not enough to keep it on top on Android */}
              <View
                style={[styles.overviewOverlay, { paddingTop: overviewPaddingTop }]}
                onLayout={onOverviewLayout}
              >
                <DashboardOverview
                  openGasTankModal={openGasTankModal}
                  animatedOverviewHeight={animatedOverviewHeight}
                  // Read only on web, and measuring it would re-render this every collapse frame
                  dashboardOverviewSize={UNMEASURED_OVERVIEW_SIZE}
                  setDashboardOverviewSize={NOOP}
                  expansion={overviewExpansion}
                  onCollapsibleLayoutChange={onCollapsibleLayoutChange}
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
