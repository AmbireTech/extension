import { formatUnits } from 'ethers'
import { useCallback, useMemo } from 'react'

import { getPrivacyPoolsAsset } from '@ambire-common/consts/privacyPools'
import {
  getPrivacyPoolsPriceKey,
  getPrivacyPoolsValuePerChain
} from '@ambire-common/libs/privacyPools/prices'
import {
  PrivacyPoolsActivityEntry,
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
  // Unique per (chain, token): the same token has a separate pool on every chain
  id: string
  chainId: string
  networkName: string
  tokenAddress: string
  symbol: string
  decimals: number
  /** Formatted with the token's own decimals - the part that can be sent on privately. */
  approvedAmount: string
  /** Whether any of it is approved, i.e. can be sent on - kept apart from the formatted amount. */
  isReadyToSend: boolean
  /**
   * The part still waiting on the association set, formatted the same way, or null when there is
   * none. Not spendable privately, so it is shown apart rather than added in.
   */
  pendingAmount: string | null
  /** USD value of the approved part, or null when the token has no known price. */
  value: number | null
}

export type PrivacyPoolsActivityDisplay = {
  id: string
  chainId: string
  networkName: string
  type: PrivacyPoolsActivityEntry['type']
  status: PrivacyPoolsActivityEntry['status']
  tokenAddress: string
  symbol: string
  amount: string
  recipient: string | null
  createdAt: number
  error?: string
}

/**
 * Which of the balance list's mutually exclusive states to render. The list is always on screen, so
 * each one has to say something of its own:
 * - 'unavailable' - the account cannot use Privacy Pools at all; the card above carries the reason
 * - 'not-loaded' - no network has been read yet, so nothing has been looked at. Not the same as an
 *   empty pool, which is a statement about the user's funds
 * - 'loading' - a first read is running and there is nothing to show yet
 * - 'ready' - at least one network has been read; rows stay put through later refreshes
 */
export type PrivacyPoolsBalancesState = 'unavailable' | 'not-loaded' | 'loading' | 'ready'

type PrivacyPoolsState = AllControllersMappingType['PrivacyPoolsController']

const NO_CHAIN_IDS: string[] = []
const NO_ACTIVITY: PrivacyPoolsActivityEntry[] = []

const selectSupportedChainIds = (state: PrivacyPoolsState) => state.supportedChainIds
const selectChains = (state: PrivacyPoolsState) => state.chains
const selectBalances = (state: PrivacyPoolsState) => state.balances
const selectActivity = (state: PrivacyPoolsState) => state.activity
const selectOperation = (state: PrivacyPoolsState) => state.operation
const selectUnavailableReason = (state: PrivacyPoolsState) => state.unavailableReason
const selectIsAvailable = (state: PrivacyPoolsState) => state.isAvailableForSelectedAccount
const selectHasSyncedAnyChain = (state: PrivacyPoolsState) => state.hasSyncedAnyChain
const selectPrices = (state: PrivacyPoolsState) => state.prices
const selectNetworks = (state: AllControllersMappingType['NetworksController']) => state.networks

/**
 * Everything the Privacy Pools screen renders, resolved in one place.
 *
 * The controller deals in raw amounts and chain ids; the views need names, decimals and prices.
 * Assembling that once here keeps a token from being described one way in the balance list and
 * another in the forms.
 */
const usePrivacyPools = () => {
  const { state: supportedChainIds = NO_CHAIN_IDS, dispatch } = useController(
    'PrivacyPoolsController',
    selectSupportedChainIds
  )
  const { state: chains } = useController('PrivacyPoolsController', selectChains)
  const { state: balancesByChain } = useController('PrivacyPoolsController', selectBalances)
  const { state: activity = NO_ACTIVITY } = useController('PrivacyPoolsController', selectActivity)
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

  // Falls back to the raw chain id rather than to a translated "Unknown network": the chains here
  // are already narrowed to the user's own networks, so a miss means something is off - and the id
  // is what identifies it.
  const getNetworkName = useCallback(
    (chainId: string) =>
      networks?.find((network) => network.chainId.toString() === chainId)?.name || chainId,
    [networks]
  )

  /**
   * USD price of a pooled token, as the Privacy Pools controller priced it - there is no selected
   * account's portfolio to take it from while a Privacy Pools account is selected.
   *
   * Null rather than 0 when the token has no known price: a balance with no price is not a balance
   * worth nothing, and the difference decides whether a row shows a value at all.
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
    () =>
      networkRows.some((row) => row.syncStatus === 'syncing' || row.syncStatus === 'initializing'),
    [networkRows]
  )

  // Shown on the balance the way the regular dashboard shows a network that failed to load; which
  // network it is, is in the network statuses
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
          const approved = Number(formatUnits(balance.approvedAmount, balance.decimals))

          return {
            id: `${chainId}:${balance.tokenAddress}`,
            chainId,
            networkName: getNetworkName(chainId),
            tokenAddress: balance.tokenAddress,
            symbol: balance.symbol,
            decimals: balance.decimals,
            approvedAmount: formatUnits(balance.approvedAmount, balance.decimals),
            isReadyToSend: balance.approvedAmount > 0n,
            pendingAmount: balance.pendingAmount
              ? formatUnits(balance.pendingAmount, balance.decimals)
              : null,
            value: price === null ? null : approved * price
          }
        }),
    [tokenBalances, getNetworkName, getTokenPrice]
  )

  // Only the approved part, matching the rows below it. What is still waiting on the association
  // set is counted separately, because it genuinely cannot be withdrawn yet.
  const totalPrivateBalance = useMemo(
    () =>
      Object.values(getPrivacyPoolsValuePerChain(balancesByChain || {}, prices || {})).reduce(
        (total, value) => total + value,
        0
      ),
    [balancesByChain, prices]
  )

  const pendingPrivateBalance = useMemo(
    () =>
      tokenBalances.reduce((total, { chainId, balance }) => {
        const price = getTokenPrice(chainId, balance.tokenAddress)
        if (price === null || !balance.pendingAmount) return total

        return total + Number(formatUnits(balance.pendingAmount, balance.decimals)) * price
      }, 0),
    [tokenBalances, getTokenPrice]
  )

  const balancesState: PrivacyPoolsBalancesState = useMemo(() => {
    if (!isAvailableForSelectedAccount) return 'unavailable'
    if (hasSyncedAnyChain) return 'ready'
    if (isSyncingAnyChain) return 'loading'

    return 'not-loaded'
  }, [isAvailableForSelectedAccount, hasSyncedAnyChain, isSyncingAnyChain])

  const activityDisplay: PrivacyPoolsActivityDisplay[] = useMemo(
    () =>
      activity.map((entry) => {
        const asset = getPrivacyPoolsAsset(BigInt(entry.chainId), entry.tokenAddress)

        return {
          id: entry.id,
          chainId: entry.chainId,
          networkName: getNetworkName(entry.chainId),
          type: entry.type,
          status: entry.status,
          tokenAddress: entry.tokenAddress,
          symbol: asset?.symbol || '',
          amount: formatUnits(entry.amount, asset?.decimals ?? 18),
          recipient: entry.recipient,
          createdAt: entry.createdAt,
          error: entry.error
        }
      }),
    [activity, getNetworkName]
  )

  /**
   * Reads every supported network for the account on screen, one after the other, however recently
   * they were read - what the refresh button does.
   *
   * Every network, including one never read on this device: its first read is the long one, but
   * the pools' history comes from the published copy where there is one, and the account is not
   * usable on a network until it has been read. The screen says when a first read is under way.
   */
  const syncAllChains = useCallback(() => {
    dispatch({ type: 'method', params: { method: 'sync', args: [] } })
  }, [dispatch])

  /**
   * What opening the account does: reads the networks not read in the last 10 minutes, once its
   * recovery phrase is backed up - see the controller's `syncIfStale`.
   */
  const syncIfStale = useCallback(() => {
    dispatch({ type: 'method', params: { method: 'syncIfStale', args: [] } })
  }, [dispatch])

  const prepareWithdrawal = useCallback(
    (params: { chainId: string; tokenAddress: string; amount: bigint; recipient: string }) => {
      dispatch({ type: 'method', params: { method: 'prepareWithdrawal', args: [params] } })
    },
    [dispatch]
  )

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
    pendingPrivateBalance,
    activity: activityDisplay,
    operation,
    tokenBalances,
    getNetworkName,
    getTokenPrice,
    syncAllChains,
    syncIfStale,
    prepareWithdrawal,
    broadcastWithdrawal,
    dismissOperation
  }
}

export default usePrivacyPools
