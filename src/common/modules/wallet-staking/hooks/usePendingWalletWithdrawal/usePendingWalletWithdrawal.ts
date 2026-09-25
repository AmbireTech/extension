import { useCallback, useEffect, useRef, useState } from 'react'

import { useTranslation } from '@common/config/localization'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'

import type { WalletStakingTxnIdLookupError } from '@ambire-common/controllers/walletToken/walletToken'

/** Why the transaction ID that the user entered didn't reveal a pending withdrawal. */
export type WithdrawalTxnIdLookupError = WalletStakingTxnIdLookupError

const selectPendingWithdrawals = (state: AllControllersMappingType['WalletTokenController']) =>
  state.pendingWithdrawals
const selectIsWithdrawalsLookupEnabled = (
  state: AllControllersMappingType['FeatureFlagsController']
) => state.flags.walletStakingWithdrawalsLookup

/**
 * Loads the account's pending $WALLET withdrawal through the WalletTokenController and ticks a
 * clock while one is still counting down. The controller finds the withdrawals (from the relayer,
 * or - when the user opted out of the lookup - from the transactions made from this device and
 * the transaction IDs that the user entered) and checks them against the staking contract.
 */
const usePendingWalletWithdrawal = (accountAddr?: string) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { state: pendingWithdrawalsByAccount, dispatch: walletTokenDispatch } = useController(
    'WalletTokenController',
    selectPendingWithdrawals
  )
  const { state: isWithdrawalsLookupEnabled, dispatch: featureFlagsDispatch } = useController(
    'FeatureFlagsController',
    selectIsWithdrawalsLookupEnabled
  )
  const [nowMs, setNowMs] = useState(() => Date.now())
  const accountPendingWithdrawals = accountAddr
    ? pendingWithdrawalsByAccount?.[accountAddr]
    : undefined
  const pendingWithdrawal = accountPendingWithdrawals?.latestWithdrawal || null
  const totalPendingShares = accountPendingWithdrawals?.totalShares || 0n
  const status = accountPendingWithdrawals?.status
  // Until the first load for the account starts, there is nothing to show yet
  const isLoading = !!accountAddr && (!status || status === 'loading')
  const hasLoadFailed = status === 'error'
  const txnIdLookupError = accountPendingWithdrawals?.txnIdLookupError || null
  const isTxnIdLookupLoading = !!accountPendingWithdrawals?.isTxnIdLookupLoading
  const prevStatusRef = useRef(status)

  const reload = useCallback(() => {
    if (!accountAddr) return

    walletTokenDispatch({
      type: 'method',
      params: { method: 'loadPendingWithdrawals', args: [accountAddr] }
    })
  }, [accountAddr, walletTokenDispatch])

  // Loads again when the user turns the withdrawals lookup on or off, because it changes where
  // the withdrawals come from
  useEffect(() => {
    reload()
  }, [reload, isWithdrawalsLookupEnabled])

  useEffect(() => {
    const prevStatus = prevStatusRef.current
    prevStatusRef.current = status
    if (status !== 'error' || prevStatus === 'error') return

    addToast(t("We couldn't check your pending withdrawal. Please try again."), { type: 'error' })
  }, [addToast, status, t])

  /** Looks for the pending withdrawal in a transaction ID that the user entered. */
  const findWithdrawalByTxnId = useCallback(
    (txnId: string) => {
      if (!accountAddr) return

      walletTokenDispatch({
        type: 'method',
        params: { method: 'findPendingWithdrawalInTxn', args: [accountAddr, txnId] }
      })
    },
    [accountAddr, walletTokenDispatch]
  )

  /** Turns the relayer lookup back on. This sends the account address to Ambire. */
  const enableWithdrawalsLookup = useCallback(() => {
    featureFlagsDispatch({
      type: 'method',
      params: { method: 'setFeatureFlag', args: ['walletStakingWithdrawalsLookup', true] }
    })
  }, [featureFlagsDispatch])

  useEffect(() => {
    if (!pendingWithdrawal) return undefined

    const countdownInterval = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(countdownInterval)
  }, [pendingWithdrawal])

  return {
    pendingWithdrawal,
    totalPendingShares,
    isLoading,
    hasLoadFailed,
    nowMs,
    reload,
    isWithdrawalsLookupEnabled,
    enableWithdrawalsLookup,
    findWithdrawalByTxnId,
    txnIdLookupError,
    isTxnIdLookupLoading
  }
}

export default usePendingWalletWithdrawal
