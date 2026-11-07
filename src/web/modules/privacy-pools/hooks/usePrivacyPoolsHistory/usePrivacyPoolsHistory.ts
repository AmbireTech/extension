import { useCallback, useMemo } from 'react'

import { PrivacyPoolsHistoryFilters } from '@ambire-common/interfaces/privacyPools'
import useController from '@common/hooks/useController'
import useControllerSession from '@common/hooks/useControllerSession'
import usePrivacyPoolsAccounts from '@common/hooks/usePrivacyPoolsAccounts'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

type PrivacyPoolsState = AllControllersMappingType['PrivacyPoolsController']

/**
 * What a history screen shows:
 * - 'unavailable' - the account cannot use Privacy Pools now, e.g. the wallet is locked
 * - 'waiting-for-backup' - nothing is read until the recovery phrase is backed up
 * - 'loading' - not every network shown has been read yet
 * - 'empty' - read, and nothing happened yet
 * - 'ready' - the page has entries
 */
export type PrivacyPoolsHistoryListState =
  | 'unavailable'
  | 'waiting-for-backup'
  | 'loading'
  | 'empty'
  | 'ready'

const selectHistory = (state: PrivacyPoolsState) => state.history
const selectUnavailableReason = (state: PrivacyPoolsState) => state.unavailableReason

interface Props {
  /**
   * The screen's session. The dashboard's and the settings' are closed by the background when the
   * window closes, so it is the one in their URL - see `handleCleanUpOnPortDisconnect`.
   */
  sessionId: string
  /** Whether the screen shows the history now, e.g. its tab is open. */
  isEnabled: boolean
  /** One network, or null for all of them. */
  chainId: string | null
  itemsPerPage: number
}

/**
 * A page of the selected Privacy Pools account's history, for one screen. Opens the screen's
 * session while it is shown, which reads the history, and closes it after, so syncs stop reading
 * it - see `PrivacyPoolsController.filterHistory`.
 */
const usePrivacyPoolsHistory = ({ sessionId, isEnabled, chainId, itemsPerPage }: Props) => {
  const { state: history, dispatch } = useController('PrivacyPoolsController', selectHistory)
  const { state: unavailableReason } = useController(
    'PrivacyPoolsController',
    selectUnavailableReason
  )
  const { selectedAccountId, selectedAccount } = usePrivacyPoolsAccounts()
  // Not read until it is backed up - see `PrivacyPoolsController.syncInBackground`
  const isWaitingForBackup = !!selectedAccount && !selectedAccount.isBackedUp

  const filters: PrivacyPoolsHistoryFilters = useMemo(() => (chainId ? { chainId } : {}), [chainId])

  const loadPage = useCallback(
    (fromPage: number, pageItemsPerPage = itemsPerPage) =>
      dispatch({
        type: 'method',
        params: {
          method: 'filterHistory',
          args: [sessionId, filters, { fromPage, itemsPerPage: pageItemsPerPage }]
        }
      }),
    [dispatch, filters, itemsPerPage, sessionId]
  )

  useControllerSession({
    isEnabled: isEnabled && !unavailableReason,
    // Reopened once backed up too, to read what was waiting for it
    reopenOn: `${selectedAccountId}-${chainId ?? ''}-${isWaitingForBackup}`,
    open: () => loadPage(0),
    close: () =>
      dispatch({ type: 'method', params: { method: 'resetHistoryFilters', args: [sessionId] } })
  })

  const session = history?.[sessionId] ?? null

  const listState: PrivacyPoolsHistoryListState = useMemo(() => {
    if (unavailableReason) return 'unavailable'
    if (isWaitingForBackup) return 'waiting-for-backup'
    if (!session?.result) return 'loading'
    if (!session.result.itemsTotal) return 'empty'

    return 'ready'
  }, [isWaitingForBackup, session?.result, unavailableReason])

  // A refresh reads the history again too, as a screen shows it
  const retry = useCallback(
    () => dispatch({ type: 'method', params: { method: 'sync', args: [] } }),
    [dispatch]
  )

  return {
    session,
    listState,
    unavailableReason,
    loadPage,
    retry
  }
}

export default usePrivacyPoolsHistory
