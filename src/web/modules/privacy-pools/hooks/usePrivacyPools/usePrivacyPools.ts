import { formatUnits } from 'ethers'
import { useCallback, useMemo } from 'react'

import { getPrivacyPoolsPriceKey } from '@ambire-common/libs/privacyPools/prices'
import {
  PrivacyPoolsChainState,
  PrivacyPoolsTokenBalance
} from '@ambire-common/interfaces/privacyPools'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

export type PrivacyPoolsNetworkRow = {
  chainId: string
  networkName: string
  syncStatus: PrivacyPoolsChainState['syncStatus']
  /** See `PrivacyPoolsChainState['isInitialSyncDone']`. */
  isInitialSyncDone: boolean | null
  syncStartedAt: number | null
  lastSyncedAt: number | null
  error: string | null
}

export type PrivacyPoolsBalanceDisplay = {
  // Per (chain, token): each chain has its own pool for a token
  id: string
  chainId: string
  networkName: string
  tokenAddress: string
  symbol: string
  decimals: number
  /** The approved and the pending part together, formatted with the token's decimals. */
  totalAmount: string
  /** The privately spendable part, formatted with the token's decimals. */
  approvedAmount: string
  /** The part still waiting on the association set, or null. Not spendable, so shown apart. */
  pendingAmount: string | null
  /** The same part in the token's smallest units. */
  pendingAmountRaw: bigint
  /** USD value of the total amount, or null when the token has no known price. */
  value: number | null
}

/**
 * State of the balance list:
 * - 'unavailable' - the account cannot use Privacy Pools; the card above shows why
 * - 'not-loaded' - no network read yet (not the same as an empty pool)
 * - 'loading' - a first read is running, nothing to show yet
 * - 'ready' - at least one network read; rows stay through later refreshes
 */
export type PrivacyPoolsBalancesState = 'unavailable' | 'not-loaded' | 'loading' | 'ready'

type PrivacyPoolsState = AllControllersMappingType['PrivacyPoolsController']

const NO_CHAIN_IDS: string[] = []

const selectSupportedChainIds = (state: PrivacyPoolsState) => state.supportedChainIds
const selectChains = (state: PrivacyPoolsState) => state.chains
const selectBalances = (state: PrivacyPoolsState) => state.balances
const selectOperation = (state: PrivacyPoolsState) => state.operation
const selectUnavailableReason = (state: PrivacyPoolsState) => state.unavailableReason
const selectIsAvailable = (state: PrivacyPoolsState) => state.isAvailableForSelectedAccount
const selectHasSyncedAnyChain = (state: PrivacyPoolsState) => state.hasSyncedAnyChain
const selectPrices = (state: PrivacyPoolsState) => state.prices
const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

/**
 * Privacy Pools state resolved for display (network names, decimals, prices), in one place so the
 * balance list and the forms describe a token the same way.
 */
const usePrivacyPools = () => {
  const { state: supportedChainIds = NO_CHAIN_IDS, dispatch } = useController(
    'PrivacyPoolsController',
    selectSupportedChainIds
  )
  const { state: chains } = useController('PrivacyPoolsController', selectChains)
  const { state: balancesByChain } = useController('PrivacyPoolsController', selectBalances)
  const { state: operation = null } = useController('PrivacyPoolsController', selectOperation)
  const { state: unavailableReason = null } = useController(
    'PrivacyPoolsController',
    selectUnavailableReason
  )
  const { state: isAvailableForSelectedAccount = false } = useController(
    'PrivacyPoolsController',
    selectIsAvailable
  )
  const { state: hasSyncedAnyChain = false } = useController(
    'PrivacyPoolsController',
    selectHasSyncedAnyChain
  )
  const { state: prices } = useController('PrivacyPoolsController', selectPrices)
  const { state: networks } = useController('NetworksController', selectNetworks)

  // Falls back to the chain id, not "Unknown network": a miss is a bug and the id identifies it
  const getNetworkName = useCallback(
    (chainId: string) =>
      networks?.find((network) => network.chainId.toString() === chainId)?.name || chainId,
    [networks]
  )

  /**
   * USD price from the Privacy Pools controller (a Privacy Pools account has no portfolio).
   * Null, not 0, when unknown: then the row shows no value at all.
   */
  const getTokenPrice = useCallback(
    (chainId: string, tokenAddress: string) =>
      prices?.[getPrivacyPoolsPriceKey(chainId, tokenAddress)] ?? null,
    [prices]
  )

  const networkRows: PrivacyPoolsNetworkRow[] = useMemo(
    () =>
      supportedChainIds.map((chainId) => {
        const chain = chains?.[chainId]

        return {
          chainId,
          networkName: getNetworkName(chainId),
          syncStatus: chain?.syncStatus || 'idle',
          isInitialSyncDone: chain?.isInitialSyncDone ?? null,
          syncStartedAt: chain?.syncStartedAt ?? null,
          lastSyncedAt: chain?.lastSyncedAt ?? null,
          error: chain?.error ?? null
        }
      }),
    [supportedChainIds, chains, getNetworkName]
  )

  const isSyncingAnyChain = useMemo(
    () => networkRows.some((row) => row.syncStatus === 'syncing'),
    [networkRows]
  )

  // Flagged on the balance like a failed network on the regular dashboard
  const hasSyncError = useMemo(() => networkRows.some((row) => !!row.error), [networkRows])

  const tokenBalances = useMemo(
    () =>
      Object.entries(balancesByChain || {}).flatMap(([chainId, chainBalances]) =>
        (chainBalances as PrivacyPoolsTokenBalance[]).map((balance) => ({ chainId, balance }))
      ),
    [balancesByChain]
  )

  const balances: PrivacyPoolsBalanceDisplay[] = useMemo(
    () =>
      tokenBalances
        .filter(({ balance }) => balance.totalAmount > 0n)
        .map(({ chainId, balance }) => {
          const price = getTokenPrice(chainId, balance.tokenAddress)
          const total = Number(formatUnits(balance.totalAmount, balance.decimals))

          return {
            id: `${chainId}:${balance.tokenAddress}`,
            chainId,
            networkName: getNetworkName(chainId),
            tokenAddress: balance.tokenAddress,
            symbol: balance.symbol,
            decimals: balance.decimals,
            totalAmount: formatUnits(balance.totalAmount, balance.decimals),
            approvedAmount: formatUnits(balance.approvedAmount, balance.decimals),
            pendingAmount: balance.pendingAmount
              ? formatUnits(balance.pendingAmount, balance.decimals)
              : null,
            pendingAmountRaw: balance.pendingAmount,
            value: price === null ? null : total * price
          }
        }),
    [tokenBalances, getNetworkName, getTokenPrice]
  )

  // The pending part too, like the rows: it shows how much the account holds, while the rows tell
  // the pending part apart
  const totalPrivateBalance = useMemo(
    () =>
      tokenBalances.reduce((total, { chainId, balance }) => {
        const price = getTokenPrice(chainId, balance.tokenAddress)
        if (price === null) return total

        return total + Number(formatUnits(balance.totalAmount, balance.decimals)) * price
      }, 0),
    [tokenBalances, getTokenPrice]
  )

  const balancesState: PrivacyPoolsBalancesState = useMemo(() => {
    if (!isAvailableForSelectedAccount) return 'unavailable'
    if (hasSyncedAnyChain) return 'ready'
    if (isSyncingAnyChain) return 'loading'

    return 'not-loaded'
  }, [isAvailableForSelectedAccount, hasSyncedAnyChain, isSyncingAnyChain])

  /** Reads every supported network, however recently read - the refresh button. */
  const syncAllChains = useCallback(() => {
    dispatch({ type: 'method', params: { method: 'sync', args: [] } })
  }, [dispatch])

  /** On open: reads networks not read in 10 minutes, once the phrase is backed up. */
  const syncIfStale = useCallback(() => {
    dispatch({ type: 'method', params: { method: 'syncIfStale', args: [] } })
  }, [dispatch])

  const prepareWithdrawal = useCallback(
    (params: { chainId: string; tokenAddress: string; amount: bigint; recipient: string }) => {
      dispatch({ type: 'method', params: { method: 'prepareWithdrawal', args: [params] } })
    },
    [dispatch]
  )

  /** Runs a transfer proved a while ago again - see `PrivacyPoolsController.recheckWithdrawal`. */
  const recheckWithdrawal = useCallback(() => {
    dispatch({ type: 'method', params: { method: 'recheckWithdrawal', args: [] } })
  }, [dispatch])

  const broadcastWithdrawal = useCallback(() => {
    dispatch({ type: 'method', params: { method: 'broadcastWithdrawal', args: [] } })
  }, [dispatch])

  const dismissOperation = useCallback(() => {
    dispatch({ type: 'method', params: { method: 'dismissOperation', args: [] } })
  }, [dispatch])

  return {
    unavailableReason,
    isAvailable: isAvailableForSelectedAccount,
    hasSyncedAnyChain,
    isSyncingAnyChain,
    hasSyncError,
    networkRows,
    balances,
    balancesState,
    totalPrivateBalance,
    operation,
    tokenBalances,
    getNetworkName,
    getTokenPrice,
    syncAllChains,
    syncIfStale,
    prepareWithdrawal,
    recheckWithdrawal,
    broadcastWithdrawal,
    dismissOperation
  }
}

export default usePrivacyPools
