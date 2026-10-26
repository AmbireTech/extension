import { useCallback, useEffect, useRef, useState } from 'react'

import useController from '@common/hooks/useController'
import useExtraEntropy from '@common/hooks/useExtraEntropy'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectMainStatuses = (state: AllControllersMappingType['MainController']) => state.statuses
const selectPrivacyPoolsAccountId = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.privacyPoolsAccountId

/**
 * The account being added. A new seed's id is unknown in advance, so it is recognised as any
 * newly selected account.
 */
type PendingAddition =
  | { kind: 'stored-seed'; seedId: string }
  | { kind: 'new-seed'; selectedAccountIdBefore: string | null }

/**
 * Adds and selects a Privacy Pools account. `onAdded` fires once both the status and the selection
 * reach the UI, so the previous account's dashboard does not flash. The background toasts failures.
 * `canAdd` is false while an add or another account selection is running.
 */
const useAddPrivacyPoolsAccount = ({ onAdded }: { onAdded: () => void }) => {
  const { state: statuses, dispatch: mainDispatch } = useController(
    'MainController',
    selectMainStatuses
  )
  const { state: privacyPoolsAccountId } = useController(
    'SelectedAccountController',
    selectPrivacyPoolsAccountId
  )
  const { getExtraEntropy } = useExtraEntropy()
  const [pending, setPending] = useState<PendingAddition | null>(null)
  // The status may be left from an earlier selection, so it counts only after this one loads
  const hasSeenLoading = useRef(false)

  const addFromStoredSeed = useCallback(
    (seedId: string) => {
      hasSeenLoading.current = false
      setPending({ kind: 'stored-seed', seedId })
      mainDispatch({ type: 'method', params: { method: 'addPrivacyPoolsAccount', args: [seedId] } })
    },
    [mainDispatch]
  )

  const addFromNewSeed = useCallback(() => {
    hasSeenLoading.current = false
    setPending({ kind: 'new-seed', selectedAccountIdBefore: privacyPoolsAccountId ?? null })
    mainDispatch({
      type: 'method',
      params: {
        method: 'addPrivacyPoolsAccountFromNewSeed',
        args: [{ extraEntropy: getExtraEntropy() }]
      }
    })
  }, [getExtraEntropy, mainDispatch, privacyPoolsAccountId])

  useEffect(() => {
    if (!pending) return

    if (statuses.selectAccount === 'LOADING') {
      hasSeenLoading.current = true
      return
    }
    if (!hasSeenLoading.current) return

    const isAddedAccountSelected =
      pending.kind === 'stored-seed'
        ? privacyPoolsAccountId === pending.seedId
        : !!privacyPoolsAccountId && privacyPoolsAccountId !== pending.selectedAccountIdBefore
    // On success, wait for the selection too: it may reach the UI a moment after the status
    const isOver =
      isAddedAccountSelected ||
      statuses.selectAccount === 'ERROR' ||
      statuses.selectAccount === 'INITIAL'
    if (!isOver) return

    // The background reports only through state, there is no event to react to
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPending(null)
    if (isAddedAccountSelected) onAdded()
  }, [onAdded, pending, privacyPoolsAccountId, statuses.selectAccount])

  // While another selection runs, the background drops an add without a word, and the sheet
  // would wait for it forever
  const canAdd = !pending && statuses.selectAccount === 'INITIAL'

  return { addFromStoredSeed, addFromNewSeed, pending, canAdd }
}

export default useAddPrivacyPoolsAccount
