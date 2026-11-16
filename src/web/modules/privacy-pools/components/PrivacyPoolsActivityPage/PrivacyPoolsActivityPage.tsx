import React, { FC, useCallback, useMemo } from 'react'
import { View } from 'react-native'

import { PrivacyPoolsHistoryEntry } from '@ambire-common/interfaces/privacyPools'
import Alert from '@common/components/Alert'
import Button from '@common/components/Button'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import ActivityPositionsSkeleton from '@common/modules/dashboard/components/Activity/ActivityPositionsSkeleton'
import DashboardPageScrollContainer from '@common/modules/dashboard/components/DashboardPageScrollContainer'
import { TabType } from '@common/modules/dashboard/components/TabsAndSearch/Tabs/Tab/Tab'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import PrivacyPoolsHistoryItem from '@web/modules/privacy-pools/components/PrivacyPoolsHistoryItem'
import PrivacyPoolsHistoryNotice from '@web/modules/privacy-pools/components/PrivacyPoolsHistoryNotice'
import usePrivacyPoolsHistory from '@web/modules/privacy-pools/hooks/usePrivacyPoolsHistory'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  openTab: TabType
  /** The dashboard's, so the background closes it with the window. */
  sessionId: string
}

type Item = PrivacyPoolsHistoryEntry | 'error' | 'skeleton' | 'notice' | 'load-more'

// Like the regular Activity tab
const ITEMS_PER_PAGE = 10

const selectDashboardNetworkFilter = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.dashboardNetworkFilter

/** The Activity page of a Privacy Pools account, a slide of the dashboard carousel. */
const PrivacyPoolsActivityPage: FC<Props> = ({ openTab, sessionId }) => {
  const { t } = useTranslation()
  const { state: dashboardNetworkFilter } = useController(
    'SelectedAccountController',
    selectDashboardNetworkFilter
  )
  const { session, listState, unavailableReason, loadPage, retry } = usePrivacyPoolsHistory({
    sessionId,
    // Only while the tab is open, as reading the history costs every sync seconds
    isEnabled: openTab === 'activity',
    chainId: dashboardNetworkFilter ? String(dashboardNetworkFilter) : null,
    itemsPerPage: ITEMS_PER_PAGE
  })

  const result = session?.result
  const hasMore = !!result && result.itemsTotal > result.items.length

  const data: Item[] = useMemo(() => {
    const items: Item[] = session?.error ? ['error'] : []

    if (listState === 'loading') return [...items, 'skeleton']
    if (listState !== 'ready') return [...items, 'notice']

    return [...items, ...(result?.items || []), 'load-more']
  }, [listState, result?.items, session?.error])

  // Grows the one page from the top, like the regular Activity tab's "Show more"
  const showMore = useCallback(
    () => loadPage(0, (session?.pagination.itemsPerPage || 0) + ITEMS_PER_PAGE),
    [loadPage, session?.pagination.itemsPerPage]
  )

  const renderItem = useCallback(
    ({ item }: { item: Item }) => {
      if (item === 'error')
        return (
          <Alert
            type="error"
            size="sm"
            title={session?.error || ''}
            buttonProps={{ text: t('Try again'), onPress: retry, type: 'secondary' }}
            style={spacings.mbSm}
          />
        )

      if (item === 'skeleton') return <ActivityPositionsSkeleton amount={4} />

      if (item === 'notice') {
        if (listState === 'loading' || listState === 'ready') return null

        return (
          <PrivacyPoolsHistoryNotice listState={listState} unavailableReason={unavailableReason} />
        )
      }

      if (item === 'load-more') {
        if (!hasMore) return null

        return (
          <View>
            <Button
              type="secondary"
              size="small"
              style={[flexbox.alignSelfCenter, spacings.mbSm]}
              onPress={showMore}
              text={t('Show more')}
            />
          </View>
        )
      }

      return <PrivacyPoolsHistoryItem entry={item} style={spacings.mbSm} />
    },
    [hasMore, listState, retry, session?.error, showMore, t, unavailableReason]
  )

  const keyExtractor = useCallback((item: Item) => (typeof item === 'string' ? item : item.id), [])

  // Rendered by the carousel above the pages, like the regular dashboard's
  const floatingBar = useMemo(() => ({ networkFilterTab: 'activity' as const }), [])

  return (
    <DashboardPageScrollContainer
      floatingBar={floatingBar}
      tab="activity"
      openTab={openTab}
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      scrollEventThrottle={16}
    />
  )
}

export default React.memo(PrivacyPoolsActivityPage)
