import { formatUnits } from 'ethers'
import { useCallback, useMemo } from 'react'

import {
  getPrivacyPoolsPriceKey,
  getPrivacyPoolsProjectedAmount,
  getPrivacyPoolsValuePerChain
} from '@ambire-common/libs/privacyPools/prices'
import {
  PrivacyPoolsChainState,
  PrivacyPoolsTokenBalance
} from '@ambire-common/interfaces/privacyPools'
import { TokenResult } from '@ambire-common/libs/portfolio'
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
  /**
   * Shaped like a portfolio token, for the parts shared with the regular dashboard. There the
   * pending amount is the one on its way: the amount the account will hold, against the latest
   * amount the notes hold. It is not `pendingAmount` below, the part being verified.
   */
  token: TokenResult
  /**
   * The privately spendable part less what withdrawals on their way take out, formatted with the
   * token's decimals.
   */
  approvedAmountPostSimulation: string
  /** The part still waiting on the association set, or null. Not spendable, so shown apart. */
  pendingAmount: string | null
  /** The same part in the token's smallest units. */
  pendingAmountRaw: bigint
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

/**
 * The balance shaped like a portfolio token, for the parts shared with the regular dashboard and
 * token details. Priced by the Privacy Pools controller, as the account has no portfolio, and with
 * no market data, which would be fetched.
 */
const getPortfolioToken = (
  chainId: string,
  balance: PrivacyPoolsTokenBalance,
  price: number | null
): TokenResult => {
  const projectedAmount = getPrivacyPoolsProjectedAmount(balance)

  return {
    symbol: balance.symbol,
    name: balance.symbol,
    decimals: balance.decimals,
    address: balance.tokenAddress,
    chainId: BigInt(chainId),
    amount: projectedAmount,
    latestAmount: balance.totalAmount,
    pendingAmount: projectedAmount,
    priceIn: price === null ? [] : [{ baseCurrency: 'usd', price }],
    marketDataIn: [],
    flags: { onGasTank: false, rewardsType: null, canTopUpGasTank: false, isFeeToken: false }
  }
}

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
        // A token with only a deposit on its way stays: its row tells what is arriving
        .filter(({ balance }) => balance.totalAmount > 0n || balance.simulationAmount > 0n)
        .map(({ chainId, balance }) => ({
          id: `${chainId}:${balance.tokenAddress}`,
          chainId,
          networkName: getNetworkName(chainId),
          tokenAddress: balance.tokenAddress,
          symbol: balance.symbol,
          decimals: balance.decimals,
          token: getPortfolioToken(chainId, balance, getTokenPrice(chainId, balance.tokenAddress)),
          approvedAmountPostSimulation: formatUnits(
            balance.approvedAmountPostSimulation,
            balance.decimals
          ),
          pendingAmount: balance.pendingAmount
            ? formatUnits(balance.pendingAmount, balance.decimals)
            : null,
          pendingAmountRaw: balance.pendingAmount
        })),
    [tokenBalances, getNetworkName, getTokenPrice]
  )

  // The pending part and what is on its way too, like the rows: it shows how much the account will
  // hold, while the rows tell the pending part apart. Valued like the networks screen, so the two
  // totals match
  const totalPrivateBalance = useMemo(
    () =>
      Object.values(getPrivacyPoolsValuePerChain(balancesByChain || {}, prices || {})).reduce(
        (total, value) => total + value,
        0
      ),
    [balancesByChain, prices]
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
    prepareWithdrawal,
    recheckWithdrawal,
    broadcastWithdrawal,
    dismissOperation
  }
}

export default usePrivacyPools
