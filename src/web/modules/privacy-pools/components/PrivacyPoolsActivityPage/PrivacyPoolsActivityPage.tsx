import React, { FC, ReactElement, useCallback, useMemo } from 'react'
import { Animated, View } from 'react-native'

import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import DashboardPageScrollContainer from '@common/modules/dashboard/components/DashboardPageScrollContainer'
import FloatingBottomBar from '@common/modules/dashboard/components/FloatingBottomBar'
import TabsAndSearch from '@common/modules/dashboard/components/TabsAndSearch'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import PrivacyPoolsActivity from '@web/modules/privacy-pools/components/PrivacyPoolsActivity'
import { PRIVACY_POOLS_TABS } from '@web/modules/privacy-pools/components/PrivacyPoolsTokensPage'
import { PrivacyPoolsActivityDisplay } from '@web/modules/privacy-pools/hooks/usePrivacyPools/usePrivacyPools'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectDashboardNetworkFilter = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.dashboardNetworkFilter

interface Props {
  openTab: TabType
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  sessionId: string
  animatedOverviewHeight: Animated.Value
  /** Shown above the tabs, where the regular dashboard shows its banners. */
  banners: ReactElement
  activity: PrivacyPoolsActivityDisplay[]
}

/**
 * The Activity page of a Privacy Pools account, laid out like the regular dashboard's. Like it, the
 * floating bar carries the network picker alone: the entries are not searchable.
 */
const PrivacyPoolsActivityPage: FC<Props> = ({
  openTab,
  setOpenTab,
  sessionId,
  animatedOverviewHeight,
  banners,
  activity
}) => {
  const { theme } = useTheme()
  const { state: dashboardNetworkFilter } = useController(
    'SelectedAccountController',
    selectDashboardNetworkFilter
  )

  const filteredActivity = useMemo(
    () =>
      activity.filter(
        ({ chainId }) => !dashboardNetworkFilter || chainId === String(dashboardNetworkFilter)
      ),
    [activity, dashboardNetworkFilter]
  )

  const renderItem = useCallback(
    ({ item }: { item: string }) => {
      if (item === 'header')
        return (
          <View style={{ backgroundColor: theme.primaryBackground }}>
            <TabsAndSearch
              openTab={openTab}
              setOpenTab={setOpenTab}
              sessionId={sessionId}
              tabs={PRIVACY_POOLS_TABS}
            />
          </View>
        )

      return <PrivacyPoolsActivity activity={filteredActivity} />
    },
    [filteredActivity, openTab, sessionId, setOpenTab, theme.primaryBackground]
  )

  const keyExtractor = useCallback((item: string) => item, [])

  const floatingBar = useMemo(() => ({ networkFilterTab: 'activity' as const }), [])

  return (
    <>
      <DashboardPageScrollContainer
        floatingBar={floatingBar}
        tab="activity"
        openTab={openTab}
        ListHeaderComponent={banners}
        animatedOverviewHeight={animatedOverviewHeight}
        data={['header', 'activity']}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEventThrottle={16}
      />
      {openTab === 'activity' && <FloatingBottomBar {...floatingBar} isHidden={false} />}
    </>
  )
}

export default React.memo(PrivacyPoolsActivityPage)
