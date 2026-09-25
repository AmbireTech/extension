import { useCallback, useEffect, useRef, useState } from 'react'

import { ETHEREUM_CHAIN_ID } from '@ambire-common/consts/networks'
import { WALLET_STAKING_ADDR } from '@ambire-common/consts/addresses'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import CONFIG from '@common/config/env'
import { useTranslation } from '@common/config/localization'
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

const WALLET_STAKING_COMMITMENT_ABI = 'function commitments(bytes32) view returns (uint256)'

/**
 * Loads the account's pending $WALLET withdrawal (the relayer's leave logs, reconciled with the
 * locally cached copy and with the staking contract's commitments) and ticks a clock while one is
 * still counting down.
 */
const usePendingWalletWithdrawal = (accountAddr?: string) => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { dispatchAndWait: providersDispatchAndWait } = useController('ProvidersController')
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
        const decodedWithdrawals = decodePendingWalletWithdrawals(logs, accountAddr)
        const withdrawalsById = new Map<string, PendingWalletWithdrawal>()
        if (cachedPendingWithdrawal) {
          withdrawalsById.set(
            `${cachedPendingWithdrawal.shares}:${cachedPendingWithdrawal.unlocksAt}`,
            cachedPendingWithdrawal
          )
        }
        decodedWithdrawals.forEach((withdrawal) => {
          withdrawalsById.set(`${withdrawal.shares}:${withdrawal.unlocksAt}`, withdrawal)
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

        if (!hasCommitmentErrors) {
          if (latestWithdrawal) await persistPendingWithdrawal(latestWithdrawal)
          else await removeCachedPendingWithdrawal()
        }

        if (requestId === requestIdRef.current && !signal?.aborted) {
          setPendingWithdrawal(latestWithdrawal)
          setTotalPendingShares(totalShares)
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
    [accountAddr, addToast, providersDispatchAndWait, t]
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

  useEffect(() => {
    if (!pendingWithdrawal) return undefined

    const countdownInterval = setInterval(() => setNowMs(Date.now()), 1000)
    return () => clearInterval(countdownInterval)
  }, [pendingWithdrawal])

  return { pendingWithdrawal, totalPendingShares, isLoading, hasLoadFailed, nowMs, reload }
}

export default usePendingWalletWithdrawal
