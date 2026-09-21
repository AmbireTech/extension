interface HasPendingDefiUpdateParams {
  /** {@link PortfolioController.scheduledUpdateChainIds} */
  scheduledUpdateChainIds: { [accountId: string]: bigint[] }
  accountAddr?: string
  /** The network the DeFi tab is filtered by, or null for all networks. */
  dashboardNetworkFilter: bigint | string | null
}

/**
 * Whether the selected account is waiting on the portfolio update that follows a recent
 * transaction, so the DeFi tab can tell the user their positions are about to refresh.
 *
 * With a network filter on, only an update for that network counts, since an update on another
 * network can't change what the tab currently shows.
 */
export const getHasPendingDefiUpdate = ({
  scheduledUpdateChainIds,
  accountAddr,
  dashboardNetworkFilter
}: HasPendingDefiUpdateParams): boolean => {
  if (!accountAddr) return false

  const pendingChainIds = scheduledUpdateChainIds[accountAddr]

  if (!pendingChainIds?.length) return false
  if (dashboardNetworkFilter === null) return true

  const filteredChainId = String(dashboardNetworkFilter)

  return pendingChainIds.some((chainId) => String(chainId) === filteredChainId)
}
