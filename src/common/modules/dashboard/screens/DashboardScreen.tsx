import React, { useCallback, useRef, useState } from 'react'
import { Animated, NativeScrollEvent, NativeSyntheticEvent, View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { isWeb } from '@common/config/env'
import useController from '@common/hooks/useController'
import useDebounce from '@common/hooks/useDebounce'
import useTheme from '@common/hooks/useTheme'
import PendingActionWindowModal from '@common/modules/dashboard/components/PendingActionWindowModal'
import GasTankModal from '@web/components/GasTankModal'
import LayoutWrapper from '@web/components/LayoutWrapper'
import { getUiType } from '@web/utils/uiType'

import DashboardOverview from '../components/DashboardOverview'
import DashboardPages from '../components/DashboardPages'
import getStyles from './styles'

const { isPopup } = getUiType()

export const OVERVIEW_CONTENT_MAX_HEIGHT = 280

const SCROLL_CONFIG = {
  overview: {
    collapseThreshold: 100,
    expandThreshold: 100,
    expandScrollDistance: 100
  },
  search: {
    hideThreshold: 30,
    showThreshold: 20,
    showScrollDistance: 80
  }
}

const DashboardScreen = () => {
  const { styles } = useTheme(getStyles)
  const { ref: gasTankModalRef, open: openGasTankModal, close: closeGasTankModal } = useModalize()
  const [dashboardOverviewSize, setDashboardOverviewSize] = useState({
    width: 0,
    height: 0
  })
  const debouncedDashboardOverviewSize = useDebounce({ value: dashboardOverviewSize, delay: 100 })
  const animatedOverviewHeight = useRef(new Animated.Value(OVERVIEW_CONTENT_MAX_HEIGHT)).current
  const [isSearchHidden, setIsSearchHidden] = useState(false)
  const isAnimating = useRef(false)
  const lastContentHeight = useRef(0)
  const isOverviewExpanded = useRef(true)
  const lastOffsetY = useRef(0)
  const scrollUpStartedAt = useRef(0)

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

      if (
        isAnimating.current ||
        (lastContentHeight.current > 0 && lastContentHeight.current !== contentHeight)
      ) {
        lastContentHeight.current = contentHeight
        return
      }
      lastContentHeight.current = contentHeight

      if (scrollUpStartedAt.current === 0 && lastOffsetY.current > y) {
        scrollUpStartedAt.current = y
      } else if (scrollUpStartedAt.current > 0 && y > lastOffsetY.current) {
        scrollUpStartedAt.current = 0
      }
      lastOffsetY.current = y

      const hasScrolledUp = scrollUpStartedAt.current > 0 && y < scrollUpStartedAt.current

      // Overview state transitions
      const wouldStillBeScrolledAfterCollapse =
        y > SCROLL_CONFIG.overview.expandThreshold &&
        // Ensure there's enough content to scroll after collapsing the overview
        contentHeight > OVERVIEW_CONTENT_MAX_HEIGHT * 2

      let shouldChangeOverview = false
      if (isOverviewExpanded.current) {
        shouldChangeOverview =
          !hasScrolledUp &&
          y > SCROLL_CONFIG.overview.collapseThreshold &&
          wouldStillBeScrolledAfterCollapse
      } else {
        shouldChangeOverview =
          y < SCROLL_CONFIG.overview.expandThreshold ||
          (hasScrolledUp &&
            y < scrollUpStartedAt.current - SCROLL_CONFIG.overview.expandScrollDistance)
      }

      // Search visibility
      const shouldShowSearch =
        y < SCROLL_CONFIG.search.showThreshold ||
        (hasScrolledUp && y < scrollUpStartedAt.current - SCROLL_CONFIG.search.showScrollDistance)

      setIsSearchHidden(!shouldShowSearch)

      if (shouldChangeOverview) {
        isOverviewExpanded.current = !isOverviewExpanded.current
        isAnimating.current = true

        Animated.spring(animatedOverviewHeight, {
          toValue: isOverviewExpanded.current ? OVERVIEW_CONTENT_MAX_HEIGHT : 0,
          bounciness: 0,
          speed: 2.8,
          overshootClamping: true,
          useNativeDriver: !isWeb
        }).start(() => {
          isAnimating.current = false
        })
      }
    },
    [animatedOverviewHeight]
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
