import React, { FC, useCallback, useMemo } from 'react'

import DashboardPageScrollContainer from '@common/modules/dashboard/components/DashboardPageScrollContainer'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import PrivacyPoolsActivity from '@web/modules/privacy-pools/components/PrivacyPoolsActivity'

interface Props {
  openTab: TabType
}

const DATA = ['activity']

/** The Activity page of a Privacy Pools account, a slide of the dashboard carousel. */
const PrivacyPoolsActivityPage: FC<Props> = ({ openTab }) => {
  const renderItem = useCallback(() => <PrivacyPoolsActivity />, [])

  const keyExtractor = useCallback((item: string) => item, [])

  // Rendered by the carousel above the pages, like the regular dashboard's
  const floatingBar = useMemo(() => ({ networkFilterTab: 'activity' as const }), [])

  return (
    <DashboardPageScrollContainer
      floatingBar={floatingBar}
      tab="activity"
      openTab={openTab}
      data={DATA}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      scrollEventThrottle={16}
    />
  )
}

export default React.memo(PrivacyPoolsActivityPage)
