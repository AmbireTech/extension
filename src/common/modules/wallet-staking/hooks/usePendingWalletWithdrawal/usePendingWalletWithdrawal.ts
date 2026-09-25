import { useCallback, useEffect, useRef, useState } from 'react'

import { ETHEREUM_CHAIN_ID } from '@ambire-common/consts/networks'
import { WALLET_STAKING_ADDR } from '@ambire-common/consts/addresses'
import { isValidWalletStakingTxnId } from '@ambire-common/libs/walletStaking/localWithdrawals'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import CONFIG from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { AllControllersMappingType } from '@common/constants/controllersMapping'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import {
  decodePendingWalletWithdrawals,
  getActivePendingWalletWithdrawals,
  getPendingWalletWithdrawalCommitmentId,
  getPendingWalletWithdrawalStorageKey,
  getPendingWalletWithdrawalSummary,
  LOG_LEAVE_TOPIC,
  parseCachedPendingWalletWithdrawal,
  parseWalletStakingRelayerLogsResponse,
  PendingWalletWithdrawal,
  serializePendingWalletWithdrawal
} from '@common/modules/wallet-staking/helpers/pendingWithdrawal'
import { storage } from '@common/services/storage'

import type { TxnPendingWalletWithdrawals } from '@ambire-common/libs/walletStaking/localWithdrawals'

const WALLET_STAKING_COMMITMENT_ABI = 'function commitments(bytes32) view returns (uint256)'
// Reads one transaction receipt per unstake, so it can take longer than the default
const LOCAL_TXNS_LOOKUP_TIMEOUT_MS = 30_000

/** Why the transaction ID that the user entered didn't reveal a pending withdrawal. */
export type WithdrawalTxnIdLookupError = 'invalid' | 'not-found' | 'failed'

interface LocalTxnsLookupResult {
  results: TxnPendingWalletWithdrawals[]
  failedTxnIds: string[]
}

const selectIsWithdrawalsLookupEnabled = (
  state: AllControllersMappingType['FeatureFlagsController']
) => state.flags.walletStakingWithdrawalsLookup

const NO_USER_TXN_IDS: string[] = []

const getWithdrawalId = ({ shares, unlocksAt }: PendingWalletWithdrawal) => `${shares}:${unlocksAt}`

/**
 * Loads the account's pending $WALLET withdrawal (the relayer's leave logs, reconciled with the
 * locally cached copy and with the staking contract's commitments) and ticks a clock while one is
 * still counting down. When the user opted out of the withdrawals lookup, the relayer isn't
 * contacted (it would learn the account address) - the leave events are read instead from the
 * receipts of the unstake transactions known to this device and of the transaction IDs that the
 * user entered.
 */
const usePendingWalletWithdrawal = (accountAddr?: string) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { dispatchAndWait: providersDispatchAndWait } = useController('ProvidersController')
  const { dispatchAndWait: mainDispatchAndWait } = useController('MainController')
  const { state: isWithdrawalsLookupEnabled, dispatch: featureFlagsDispatch } = useController(
    'FeatureFlagsController',
    selectIsWithdrawalsLookupEnabled
  )
  // Both belong to the account they were entered for, so they reset when the account changes
  const [userTxnIdsState, setUserTxnIdsState] = useState<{
    accountAddr?: string
    txnIds: string[]
  }>({ txnIds: NO_USER_TXN_IDS })
  const [txnIdLookupErrorState, setTxnIdLookupErrorState] = useState<{
    accountAddr?: string
    error: WithdrawalTxnIdLookupError | null
  }>({ error: null })
  const userTxnIds =
    userTxnIdsState.accountAddr === accountAddr ? userTxnIdsState.txnIds : NO_USER_TXN_IDS
  const txnIdLookupError =
    txnIdLookupErrorState.accountAddr === accountAddr ? txnIdLookupErrorState.error : null
  const [pendingWithdrawal, setPendingWithdrawal] = useState<PendingWalletWithdrawal | null>(null)
  const [totalPendingShares, setTotalPendingShares] = useState(0n)
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadFailed, setHasLoadFailed] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const requestIdRef = useRef(0)
  const abortControllerRef = useRef<AbortController | null>(null)

  const loadPendingWithdrawal = useCallback(
    async (signal?: AbortSignal) => {
      const requestId = ++requestIdRef.current
      setPendingWithdrawal(null)
      setTotalPendingShares(0n)
      setHasLoadFailed(false)

      if (!accountAddr) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      const storageKey = getPendingWalletWithdrawalStorageKey(accountAddr)
      let cachedPendingWithdrawal: PendingWalletWithdrawal | null = null

      const removeCachedPendingWithdrawal = async () => {
        try {
          await storage.remove(storageKey)
        } catch (error) {
          console.error('Failed to remove the pending WALLET withdrawal cache', error)
          captureException(error)
        }
      }

      const persistPendingWithdrawal = async (withdrawal: PendingWalletWithdrawal) => {
        try {
          await storage.set(storageKey, serializePendingWalletWithdrawal(withdrawal))
        } catch (error) {
          console.error('Failed to cache the pending WALLET withdrawal', error)
          captureException(error)
        }
      }

      const getCommitmentMaxTokens = async (withdrawal: PendingWalletWithdrawal) => {
        const commitmentId = getPendingWalletWithdrawalCommitmentId(accountAddr, withdrawal)
        const maxTokens = await providersDispatchAndWait<'callContractAndSendResToUi', bigint>({
          type: 'method',
          params: {
            method: 'callContractAndSendResToUi',
            args: [
              {
                chainId: ETHEREUM_CHAIN_ID,
                address: WALLET_STAKING_ADDR,
                abi: WALLET_STAKING_COMMITMENT_ABI,
                method: 'commitments',
                args: [commitmentId]
              }
            ]
          }
        })

        return BigInt(maxTokens)
      }

      try {
        try {
          const cachedValue = await storage.get(storageKey)
          cachedPendingWithdrawal = parseCachedPendingWalletWithdrawal(cachedValue)
          if (cachedValue && !cachedPendingWithdrawal) await removeCachedPendingWithdrawal()
        } catch (error) {
          console.error('Failed to read the pending WALLET withdrawal cache', error)
          captureException(error)
        }

        const getWithdrawalsFromRelayer = async () => {
          const response = await fetch(`${CONFIG.RELAYER_URL}/v2/identity/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              identity: accountAddr,
              address: WALLET_STAKING_ADDR,
              requestedTopic: LOG_LEAVE_TOPIC
            }),
            signal
          })
          if (!response.ok) throw new Error(`The relayer returned HTTP ${response.status}.`)

          const logs = parseWalletStakingRelayerLogsResponse(await response.json())
          return decodePendingWalletWithdrawals(logs, accountAddr)
        }

        const getWithdrawalsFromLocalTxns = async () => {
          const { results, failedTxnIds } = await mainDispatchAndWait<
            'findPendingWalletWithdrawalsInLocalTxns',
            LocalTxnsLookupResult
          >(
            {
              type: 'method',
              params: {
                method: 'findPendingWalletWithdrawalsInLocalTxns',
                args: [{ accountAddr, extraTxnIds: userTxnIds }]
              }
            },
            LOCAL_TXNS_LOOKUP_TIMEOUT_MS
          )
          // parseCachedPendingWalletWithdrawal validates the same string shape
          const withdrawalsByTxnId = new Map(
            results.map(({ txnId, withdrawals }) => [
              txnId,
              withdrawals.flatMap((withdrawal) => {
                const parsedWithdrawal = parseCachedPendingWalletWithdrawal(withdrawal)
                return parsedWithdrawal ? [parsedWithdrawal] : []
              })
            ])
          )

          return {
            withdrawals: Array.from(withdrawalsByTxnId.values()).flat(),
            withdrawalsByTxnId,
            failedTxnIds
          }
        }

        const localTxnsLookup = isWithdrawalsLookupEnabled
          ? null
          : await getWithdrawalsFromLocalTxns()
        const decodedWithdrawals = localTxnsLookup
          ? localTxnsLookup.withdrawals
          : await getWithdrawalsFromRelayer()
        const withdrawalsById = new Map<string, PendingWalletWithdrawal>()
        if (cachedPendingWithdrawal) {
          withdrawalsById.set(getWithdrawalId(cachedPendingWithdrawal), cachedPendingWithdrawal)
        }
        decodedWithdrawals.forEach((withdrawal) => {
          withdrawalsById.set(getWithdrawalId(withdrawal), withdrawal)
        })
        const { activeWithdrawals, errors: commitmentErrors } =
          await getActivePendingWalletWithdrawals(
            Array.from(withdrawalsById.values()),
            getCommitmentMaxTokens
          )
        const hasCommitmentErrors = commitmentErrors.length > 0
        commitmentErrors.forEach((error) => {
          console.error('Failed to check a pending WALLET withdrawal', error)
          captureException(error)
        })
        const withdrawalsToDisplay =
          activeWithdrawals.length || !cachedPendingWithdrawal
            ? activeWithdrawals
            : [cachedPendingWithdrawal]
        const { latestWithdrawal, totalShares } =
          getPendingWalletWithdrawalSummary(withdrawalsToDisplay)
        // Tells the user why the transaction ID they entered last didn't unlock the withdrawal
        const lastUserTxnId = userTxnIds[userTxnIds.length - 1]
        const activeWithdrawalIds = new Set(activeWithdrawals.map(getWithdrawalId))
        let nextTxnIdLookupError: WithdrawalTxnIdLookupError | null = null
        if (localTxnsLookup && lastUserTxnId) {
          const hasActiveWithdrawalInLastUserTxn = (
            localTxnsLookup.withdrawalsByTxnId.get(lastUserTxnId) || []
          ).some((withdrawal) => activeWithdrawalIds.has(getWithdrawalId(withdrawal)))

          if (localTxnsLookup.failedTxnIds.includes(lastUserTxnId)) nextTxnIdLookupError = 'failed'
          else if (!hasActiveWithdrawalInLastUserTxn) nextTxnIdLookupError = 'not-found'
        }

        if (!hasCommitmentErrors) {
          if (latestWithdrawal) await persistPendingWithdrawal(latestWithdrawal)
          else await removeCachedPendingWithdrawal()
        }

        if (requestId === requestIdRef.current && !signal?.aborted) {
          setPendingWithdrawal(latestWithdrawal)
          setTotalPendingShares(totalShares)
          setTxnIdLookupErrorState({ accountAddr, error: nextTxnIdLookupError })
          if (hasCommitmentErrors) {
            setHasLoadFailed(true)
            addToast(t("We couldn't check every pending withdrawal. Please try again."), {
              type: 'error'
            })
          }
        }
      } catch (error) {
        if (signal?.aborted || (error instanceof Error && error.name === 'AbortError')) return

        console.error('Failed to load pending WALLET withdrawals', error)
        captureException(error)
        if (requestId === requestIdRef.current) {
          setPendingWithdrawal(cachedPendingWithdrawal)
          setTotalPendingShares(cachedPendingWithdrawal?.shares || 0n)
          setHasLoadFailed(true)
          if (userTxnIds.length) setTxnIdLookupErrorState({ accountAddr, error: 'failed' })
          addToast(t("We couldn't check your pending withdrawal. Please try again."), {
            type: 'error'
          })
        }
      } finally {
        if (requestId === requestIdRef.current && !signal?.aborted) {
          setIsLoading(false)
        }
      }
    },
    [
      accountAddr,
      addToast,
      isWithdrawalsLookupEnabled,
      mainDispatchAndWait,
      providersDispatchAndWait,
      t,
      userTxnIds
    ]
  )

  const reload = useCallback(() => {
    abortControllerRef.current?.abort()
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    void loadPendingWithdrawal(abortController.signal)
  }, [loadPendingWithdrawal])

  useEffect(() => {
    const loadTimeout = setTimeout(reload, 0)

    return () => {
      clearTimeout(loadTimeout)
      abortControllerRef.current?.abort()
      abortControllerRef.current = null
      requestIdRef.current += 1
    }
  }, [reload])

  /** Looks for the pending withdrawal in a transaction ID that the user entered. */
  const findWithdrawalByTxnId = useCallback(
    (txnId: string) => {
      const normalizedTxnId = txnId.trim().toLowerCase()
      if (!isValidWalletStakingTxnId(normalizedTxnId)) {
        setTxnIdLookupErrorState({ accountAddr, error: 'invalid' })
        return
      }

      setTxnIdLookupErrorState({ accountAddr, error: null })
      // A new array also triggers a reload when the same ID is entered again
      setUserTxnIdsState({
        accountAddr,
        txnIds: [
          ...userTxnIds.filter((prevTxnId) => prevTxnId !== normalizedTxnId),
          normalizedTxnId
        ]
      })
    },
    [accountAddr, userTxnIds]
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
    txnIdLookupError
  }
}

export default usePendingWalletWithdrawal
