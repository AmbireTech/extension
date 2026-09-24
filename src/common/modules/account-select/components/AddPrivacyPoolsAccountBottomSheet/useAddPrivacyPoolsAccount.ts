import { useCallback, useEffect, useRef, useState } from 'react'

import useController from '@common/hooks/useController'
import useExtraEntropy from '@common/hooks/useExtraEntropy'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectMainStatuses = (state: AllControllersMappingType['MainController']) => state.statuses
const selectPrivacyPoolsAccountId = (
  state: AllControllersMappingType['SelectedAccountController']
) => state.privacyPoolsAccountId

/**
 * What is being added: the account of a stored recovery phrase, or of a new one - whose id is not
 * known until it exists, so that one is recognised as whichever account gets selected instead of
 * the one selected before.
 */
type PendingAddition =
  | { kind: 'stored-seed'; seedId: string }
  | { kind: 'new-seed'; selectedAccountIdBefore: string | null }

/**
 * Adds a Privacy Pools account and reports when it is on screen.
 *
 * Adding one also selects it, so it is done only once both have reached the UI: the background's
 * status says the work is over, the selection says it is safe to show the new account's dashboard
 * rather than a flash of the previous one. A failure is shown by the background as a toast, so
 * this only has to stop waiting.
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
  // The status may still be settling from an earlier selection, so it only counts once this
  // addition has been seen loading
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
    // A failure, or a run that settled without selecting anything, leaves nothing to wait for.
    // A success does not settle it on its own: the selection may reach the UI a moment later.
    const isOver =
      isAddedAccountSelected ||
      statuses.selectAccount === 'ERROR' ||
      statuses.selectAccount === 'INITIAL'
    if (!isOver) return

    // Follows the background, which only reports back through state - there is no event to
    // react to instead
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPending(null)
    if (isAddedAccountSelected) onAdded()
  }, [onAdded, pending, privacyPoolsAccountId, statuses.selectAccount])

  return { addFromStoredSeed, addFromNewSeed, pending }
}

export default useAddPrivacyPoolsAccount
