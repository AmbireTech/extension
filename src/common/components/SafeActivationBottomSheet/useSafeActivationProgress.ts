import { useCallback, useEffect, useMemo, useState } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import useController from '@common/hooks/useController'
import usePrevious from '@common/hooks/usePrevious'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/**
 * How far the activation of a Safe on a network has gone after it was prepared:
 * - `signing` - its transaction waits for the user's signature (or for the switch to the Safe)
 * - `activating` - it was sent, and the Safe doesn't show as active there yet
 */
export type SafeActivationProgress = 'signing' | 'activating'

/**
 * After its transaction confirms, the Safe shows as active once its state is fetched anew.
 * This long at most, as a failed transaction leaves it inactive for good.
 */
const MAX_CONFIRMING_MS = 30_000

// The selectors join the networks into a string, so they give the same value on every
// update until the networks change
const toChainIds = (chainIdsKey: string | undefined) => (chainIdsKey ? chainIdsKey.split(',') : [])

/**
 * Follows the activation of a Safe after `buildSafeDeploymentRequest` prepared it: its request
 * while it waits to be signed, then its transaction until it confirms and the Safe shows as
 * active. Returns how far it has gone on each network, keyed by chain id.
 */
const useSafeActivationProgress = (account: Account | null) => {
  const accountAddr = account?.addr

  const selectSigningChainIds = useCallback(
    (state: AllControllersMappingType['RequestsController']) => {
      if (!accountAddr) return ''

      return [...state.userRequests, ...state.userRequestsWaitingAccountSwitch]
        .flatMap((request) =>
          request.kind === 'calls' &&
          !!request.meta.isSafeDeploy &&
          request.meta.accountAddr === accountAddr
            ? [request.meta.chainId.toString()]
            : []
        )
        .join(',')
    },
    [accountAddr]
  )
  const selectSentChainIds = useCallback(
    (state: AllControllersMappingType['ActivityController']) => {
      if (!accountAddr) return ''

      return (state.broadcastedButNotConfirmed[accountAddr] || [])
        .flatMap((accountOp) => (accountOp.meta?.isSafeDeploy ? [accountOp.chainId.toString()] : []))
        .join(',')
    },
    [accountAddr]
  )
  const { state: signingChainIdsKey } = useController('RequestsController', selectSigningChainIds)
  const { state: sentChainIdsKey } = useController('ActivityController', selectSentChainIds)
  const { dispatch: accountsDispatch } = useController('AccountsController')
  const prevSentChainIdsKey = usePrevious<string>(sentChainIdsKey)
  // Confirmed, or failed - the fresh state of the Safe tells which
  const [confirmingChainIds, setConfirmingChainIds] = useState<string[]>([])

  // A transaction leaving the sent ones has confirmed or failed. The Safe's state there is
  // fetched anew, so it shows as active as soon as possible
  useEffect(() => {
    if (!accountAddr) return

    const sentChainIds = toChainIds(sentChainIdsKey)
    const doneChainIds = toChainIds(prevSentChainIdsKey).filter(
      (chainId) => !sentChainIds.includes(chainId)
    )
    if (!doneChainIds.length) return

    accountsDispatch({
      type: 'method',
      params: {
        method: 'updateAccountState',
        args: [accountAddr, 'latest', doneChainIds.map((chainId) => BigInt(chainId)), true]
      }
    })
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfirmingChainIds((current) => [...new Set([...current, ...doneChainIds])])
  }, [accountAddr, sentChainIdsKey, prevSentChainIdsKey, accountsDispatch])

  // Restarted by every newly confirmed network, so each one gets at least the whole wait
  useEffect(() => {
    if (!confirmingChainIds.length) return

    const timeout = setTimeout(() => setConfirmingChainIds([]), MAX_CONFIRMING_MS)

    return () => clearTimeout(timeout)
  }, [confirmingChainIds])

  // Another Safe's activations have nothing to do with this one
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfirmingChainIds([])
  }, [accountAddr])

  return useMemo(() => {
    const progressByChainId: Record<string, SafeActivationProgress> = {}
    confirmingChainIds.forEach((chainId) => {
      progressByChainId[chainId] = 'activating'
    })
    toChainIds(sentChainIdsKey).forEach((chainId) => {
      progressByChainId[chainId] = 'activating'
    })
    // A new request for a network wins over an earlier activation there that failed
    toChainIds(signingChainIdsKey).forEach((chainId) => {
      progressByChainId[chainId] = 'signing'
    })

    return progressByChainId
  }, [confirmingChainIds, sentChainIdsKey, signingChainIdsKey])
}

export default useSafeActivationProgress
