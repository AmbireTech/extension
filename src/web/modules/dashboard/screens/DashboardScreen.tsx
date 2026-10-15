import React, { useCallback, useContext, useState } from 'react'
import { LayoutChangeEvent, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import GasTankModal from '@common/components/GasTankModal'
import LayoutWrapper from '@common/components/LayoutWrapper'
import { ControllersStateLoadedContext } from '@common/contexts/controllersStateLoadedContext'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import DashboardOverview from '@common/modules/dashboard/components/DashboardOverview'
import DashboardPages from '@common/modules/dashboard/components/DashboardPages'
import type { OverviewCollapse } from '@common/modules/dashboard/components/DashboardPagesCarousel/DashboardPagesCarousel'
import DashboardShell from '@common/modules/dashboard/components/DashboardShell'
import PendingActionWindowModal from '@common/modules/dashboard/components/PendingActionWindowModal'
import getStyles from '@common/modules/dashboard/screens/styles'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import MobileAppPromoBanner from '@web/modules/dashboard/components/MobileAppPromoBanner'
import commonWebStyles from '@web/styles/utils/common'

const DashboardScreen = () => {
  const { styles } = useTheme(getStyles)
  const { ref: gasTankModalRef, open: openGasTankModal, close: closeGasTankModal } = useModalize()
  // The pager starts where the collapsed overview ends and slides over the part that
  // collapses, so a collapse never resizes or lays out anything. Both heights are static.
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
  // The splash hides as soon as the account is known, but the full dashboard reads
  // many deferred controllers (keystore, requests, portfolio, banners, ...). Until
  // they all arrive, render a lightweight shell (real header, menu buttons and
  // skeletons); mount the full dashboard only once every controller is ready.
  const { areAllControllerStatesLoaded } = useContext(ControllersStateLoadedContext)

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
          {/* The overview is padded instead, as it is laid out of the flow */}
          <View style={[styles.container, spacings.pt0]}>
            {/* Rendered before the pager, which has to be drawn over it */}
            <View style={[styles.overviewOverlay, spacings.ptSm]} onLayout={onOverviewLayout}>
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
                overviewHeight={collapsibleOverviewHeight}
                onOverviewCollapseChange={setOverviewCollapse}
              />
            </View>
            <MobileAppPromoBanner />
          </View>
        </>
      )}
    </LayoutWrapper>
  )
}

export default React.memo(DashboardScreen)
