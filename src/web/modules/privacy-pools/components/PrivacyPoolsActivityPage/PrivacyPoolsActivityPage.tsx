import React, { FC, ReactElement, useCallback, useMemo } from 'react'
import { View } from 'react-native'

import useTheme from '@common/hooks/useTheme'
import DashboardPageScrollContainer from '@common/modules/dashboard/components/DashboardPageScrollContainer'
import FloatingBottomBar from '@common/modules/dashboard/components/FloatingBottomBar'
import TabsAndSearch from '@common/modules/dashboard/components/TabsAndSearch'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import PrivacyPoolsActivity from '@web/modules/privacy-pools/components/PrivacyPoolsActivity'
import { PRIVACY_POOLS_TABS } from '@web/modules/privacy-pools/components/PrivacyPoolsTokensPage'

interface Props {
  openTab: TabType
  setOpenTab: React.Dispatch<React.SetStateAction<TabType>>
  sessionId: string
  /** Shown above the tabs, like the regular dashboard's banners. */
  banners: ReactElement
}

/** The Activity page of a Privacy Pools account, laid out like the regular dashboard's. */
const PrivacyPoolsActivityPage: FC<Props> = ({ openTab, setOpenTab, sessionId, banners }) => {
  const { theme } = useTheme()

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

      return <PrivacyPoolsActivity />
    },
    [openTab, sessionId, setOpenTab, theme.primaryBackground]
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
        data={['header', 'activity']}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        scrollEventThrottle={16}
      />
      {openTab === 'activity' && <FloatingBottomBar {...floatingBar} />}
    </>
  )
}

export default React.memo(PrivacyPoolsActivityPage)
