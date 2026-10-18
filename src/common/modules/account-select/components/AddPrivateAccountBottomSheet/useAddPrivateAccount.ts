import { useCallback, useEffect, useRef, useState } from 'react'

import { PrivacyProviderId } from '@ambire-common/interfaces/privateAccount'
import { getPrivateAccountSeedId } from '@ambire-common/libs/privateAccount/privateAccount'
import useController from '@common/hooks/useController'
import useExtraEntropy from '@common/hooks/useExtraEntropy'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const selectMainStatuses = (state: AllControllersMappingType['MainController']) => state.statuses
const selectPrivateAccount = (state: AllControllersMappingType['SelectedAccountController']) =>
  state.privateAccount

/**
 * The account being added. A new seed's id is unknown in advance, so it is recognised as any
 * newly selected account.
 */
type PendingAddition =
  | { kind: 'stored-seed'; seedId: string }
  | { kind: 'new-seed'; selectedAccountIdBefore: string | null }

/**
 * Adds and selects a private account of `providerId`. `onAdded` fires once both the status and
 * the selection reach the UI, so the previous account's dashboard does not flash. The background
 * toasts failures.
 */
const useAddPrivateAccount = ({
  providerId,
  onAdded
}: {
  providerId: PrivacyProviderId
  onAdded: () => void
}) => {
  const { state: statuses, dispatch: mainDispatch } = useController(
    'MainController',
    selectMainStatuses
  )
  const { state: privateAccount } = useController('SelectedAccountController', selectPrivateAccount)
  const selectedSeedId = getPrivateAccountSeedId(privateAccount, providerId)
  const { getExtraEntropy } = useExtraEntropy()
  const [pending, setPending] = useState<PendingAddition | null>(null)
  // The status may be left from an earlier selection, so it counts only after this one loads
  const hasSeenLoading = useRef(false)

  const addFromStoredSeed = useCallback(
    (seedId: string) => {
      hasSeenLoading.current = false
      setPending({ kind: 'stored-seed', seedId })
      mainDispatch({
        type: 'method',
        params: { method: 'addPrivateAccount', args: [{ providerId, seedId }] }
      })
    },
    [mainDispatch, providerId]
  )

  const addFromNewSeed = useCallback(() => {
    hasSeenLoading.current = false
    setPending({ kind: 'new-seed', selectedAccountIdBefore: selectedSeedId })
    mainDispatch({
      type: 'method',
      params: {
        method: 'addPrivateAccountFromNewSeed',
        args: [{ providerId, extraEntropy: getExtraEntropy() }]
      }
    })
  }, [getExtraEntropy, mainDispatch, providerId, selectedSeedId])

  useEffect(() => {
    if (!pending) return

    if (statuses.selectAccount === 'LOADING') {
      hasSeenLoading.current = true
      return
    }
    if (!hasSeenLoading.current) return

    const isAddedAccountSelected =
      pending.kind === 'stored-seed'
        ? selectedSeedId === pending.seedId
        : !!selectedSeedId && selectedSeedId !== pending.selectedAccountIdBefore
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
  }, [onAdded, pending, selectedSeedId, statuses.selectAccount])

  return { addFromStoredSeed, addFromNewSeed, pending }
}

export default useAddPrivateAccount
