import { Network } from '@ambire-common/interfaces/network'
import { SelectedAccountPortfolioVerification } from '@ambire-common/interfaces/selectedAccount'
import { SelectedAccountBalanceError } from '@ambire-common/libs/selectedAccount/errors'

interface BalanceWarningInput {
  balanceAffectingErrors: SelectedAccountBalanceError[]
  verification: SelectedAccountPortfolioVerification | null
  allNetworks: Network[]
  areNetworksFetchingFromRelayer: boolean
}

// Names of the networks whose Colibri verification came back as a warning.
export const getColibriWarningNetworkNames = (
  verification: SelectedAccountPortfolioVerification | null,
  allNetworks: Network[]
): string[] => {
  if (verification?.provider !== 'colibri' || verification.status !== 'warning') return []

  return verification.failedChains.map((chainId) => {
    const network = allNetworks.find((n) => n.chainId.toString() === chainId)

    return network?.name || chainId
  })
}

// The networks whose balance-affecting issues make the total balance potentially
// inaccurate.
export const getBalanceAffectedNetworkNames = ({
  balanceAffectingErrors,
  verification,
  allNetworks,
  areNetworksFetchingFromRelayer
}: BalanceWarningInput): string[] => {
  if (areNetworksFetchingFromRelayer) return []

  const errorNetworkNames = balanceAffectingErrors.flatMap((banner) => banner.networkNames)

  return [
    ...new Set([...errorNetworkNames, ...getColibriWarningNetworkNames(verification, allNetworks)])
  ]
}

// Used in the DashboardShell and DashboardOverview
// Used when caching the balance so we can prevent a flash
// of a white (no error) balance when the balance is actually inaccurate.
export const isBalanceMaybeInaccurate = (
  input: BalanceWarningInput & { isOffline: boolean }
): boolean => getBalanceAffectedNetworkNames(input).length > 0 || input.isOffline
