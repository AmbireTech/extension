import { formatUnits } from 'ethers'
import { useCallback, useMemo } from 'react'

import { TORNADO_CASH_CHAIN_ID } from '@ambire-common/consts/tornadoCash'
import useController from '@common/hooks/useController'
import {
  PrivacyPoolsBalanceDisplay,
  PrivacyPoolsBalancesState
} from '@web/modules/privacy-pools/hooks/usePrivacyPools/usePrivacyPools'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

type TornadoCashState = AllControllersMappingType['TornadoCashController']

const selectUnavailableReason = (state: TornadoCashState) => state.unavailableReason
const selectSyncState = (state: TornadoCashState) => state.syncState
const selectBalances = (state: TornadoCashState) => state.balances
const selectPrices = (state: TornadoCashState) => state.prices
const selectOperation = (state: TornadoCashState) => state.operation

const CHAIN_ID = TORNADO_CASH_CHAIN_ID.toString()

/** A note amount without a needless ".0": 1 ETH, not 1.0 ETH. */
const formatNoteAmount = (amount: bigint, decimals: number) => {
  const formatted = formatUnits(amount, decimals)
  return formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted
}

/**
 * The selected Tornado Cash account's state, in the shapes the Privacy Pools dashboard pieces take,
 * and its actions.
 */
const useTornadoCash = () => {
  const { state: unavailableReason, dispatch } = useController(
    'TornadoCashController',
    selectUnavailableReason
  )
  const { state: syncState } = useController('TornadoCashController', selectSyncState)
  const { state: balances } = useController('TornadoCashController', selectBalances)
  const { state: prices } = useController('TornadoCashController', selectPrices)
  const { state: operation } = useController('TornadoCashController', selectOperation)

  const balanceDisplays: PrivacyPoolsBalanceDisplay[] = useMemo(
    () =>
      (balances || []).map(({ assetAddress, symbol, decimals, amount, notes }) => {
        const totalAmount = formatUnits(amount, decimals)
        const price = prices?.[assetAddress.toLowerCase()]

        return {
          id: `${CHAIN_ID}:${assetAddress}`,
          chainId: CHAIN_ID,
          networkName: 'Ethereum',
          tokenAddress: assetAddress,
          symbol,
          decimals,
          totalAmount,
          // Every note can be sent: Tornado Cash has no review
          approvedAmount: totalAmount,
          pendingAmount: null,
          pendingAmountRaw: 0n,
          value: price === undefined ? null : Number(totalAmount) * price,
          notesSummary: notes
            .map(
              ({ denomination, count }) =>
                `${count} × ${formatNoteAmount(denomination, decimals)} ${symbol}`
            )
            .join(', ')
        }
      }),
    [balances, prices]
  )

  const balancesState: PrivacyPoolsBalancesState = useMemo(() => {
    if (unavailableReason) return 'unavailable'
    if (balances) return 'ready'
    if (syncState?.status === 'syncing') return 'loading'

    return 'not-loaded'
  }, [balances, syncState?.status, unavailableReason])

  const totalBalance = useMemo(
    () => balanceDisplays.reduce((sum, { value }) => sum + (value ?? 0), 0),
    [balanceDisplays]
  )

  const syncIfStale = useCallback(
    () => dispatch({ type: 'method', params: { method: 'syncIfStale', args: [] } }),
    [dispatch]
  )
  const sync = useCallback(
    () => dispatch({ type: 'method', params: { method: 'syncSelectedAccount', args: [] } }),
    [dispatch]
  )

  return {
    unavailableReason,
    isAvailable: !unavailableReason,
    syncState,
    isSyncing: syncState?.status === 'syncing',
    hasSynced: !!syncState?.lastSyncedAt,
    hasSyncError: !!syncState?.error,
    isFirstSync: syncState?.status === 'syncing' && !syncState.lastSyncedAt && !balances,
    balances: balanceDisplays,
    /** The controller's balances, with how many notes of each amount. */
    noteBalances: balances || [],
    balancesState,
    totalBalance,
    operation,
    dispatch,
    syncIfStale,
    sync
  }
}

export default useTornadoCash
