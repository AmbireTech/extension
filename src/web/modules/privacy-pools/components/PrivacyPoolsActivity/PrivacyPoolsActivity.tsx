import React, { FC, useCallback } from 'react'

import Alert from '@common/components/Alert'
import Pagination from '@common/components/Pagination'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import { useTranslation } from '@common/config/localization'
import ActivityPositionsSkeleton from '@common/modules/dashboard/components/Activity/ActivityPositionsSkeleton'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import PrivacyPoolsHistoryItem from '@web/modules/privacy-pools/components/PrivacyPoolsHistoryItem'
import PrivacyPoolsHistoryNotice from '@web/modules/privacy-pools/components/PrivacyPoolsHistoryNotice'
import usePrivacyPoolsHistory from '@web/modules/privacy-pools/hooks/usePrivacyPoolsHistory'

interface Props {
  /** The settings screen's, so the background closes it with the window. */
  sessionId: string
}

// Like the regular transaction history
const ITEMS_PER_PAGE = 10

/**
 * A Privacy Pools account's history in Settings, in pages like the regular transaction history.
 * Read from this device's copy of the pools' history. The network is asked only for the times of
 * recent blocks, to date the entries, which says nothing about the account.
 */
const PrivacyPoolsActivity: FC<Props> = ({ sessionId }) => {
  const { t } = useTranslation()
  const { session, listState, unavailableReason, loadPage, retry } = usePrivacyPoolsHistory({
    sessionId,
    isEnabled: true,
    chainId: null,
    itemsPerPage: ITEMS_PER_PAGE
  })
  const result = session?.result

  // From the session, as reopening it (e.g. on switching accounts) starts again from the first
  const page = (session?.pagination.fromPage ?? 0) + 1
  const setPage = useCallback((nextPage: number) => loadPage(nextPage - 1), [loadPage])

  const renderList = () => {
    if (listState === 'loading') return <ActivityPositionsSkeleton amount={4} />

    if (listState !== 'ready')
      return (
        <PrivacyPoolsHistoryNotice listState={listState} unavailableReason={unavailableReason} />
      )

    return (
      <ScrollableWrapper style={[spacings.mbXl, flexbox.flex1]}>
        {(result?.items || []).map((entry) => (
          <PrivacyPoolsHistoryItem key={entry.id} entry={entry} style={spacings.mbSm} />
        ))}
      </ScrollableWrapper>
    )
  }

  return (
    <>
      {!!session?.error && (
        <Alert
          type="error"
          size="sm"
          title={session.error}
          buttonProps={{ text: t('Try again'), onPress: retry, type: 'secondary' }}
          style={spacings.mbSm}
        />
      )}
      {renderList()}
      {listState === 'ready' && (
        <Pagination
          maxPages={result?.maxPages || 0}
          isNextDisabled={page >= (result?.maxPages || 0)}
          style={{ marginLeft: 'auto' }}
          page={page}
          setPage={setPage}
        />
      )}
    </>
  )
}

export default React.memo(PrivacyPoolsActivity)
