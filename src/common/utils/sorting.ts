import { Network, SupportedNetworks } from '@ambire-common/interfaces/network'
import { SelectedAccountPortfolio } from '@ambire-common/interfaces/selectedAccount'

const networkSort = (a: Network, b: Network, networks: Network[]) => {
  // Sorts the networks in the order they are added.
  // In the future we might allow the user to sort them or sort them by some other criteria.
  const aIndex = networks.findIndex((n) => n.chainId === a.chainId)
  const bIndex = networks.findIndex((n) => n.chainId === b.chainId)

  return aIndex - bIndex
}

/**
 * Compares two chain ids by how much value the account holds on them, richest
 * first. Chains missing from the balances rank as zero.
 */
const compareChainIdsByBalance = (
  a: string,
  b: string,
  balancePerNetwork: SelectedAccountPortfolio['balancePerNetwork']
) => (balancePerNetwork[b] || 0) - (balancePerNetwork[a] || 0)

/**
 * Orders networks the way the Dashboard does, richest chain first. Networks the
 * account can't use are pushed to the bottom, and networks holding the same
 * value keep the order they came in. Returns a new array.
 */
const sortNetworksByBalance = <T extends Network | SupportedNetworks>(
  networks: T[],
  balancePerNetwork: SelectedAccountPortfolio['balancePerNetwork']
): T[] =>
  [...networks].sort((a, b) => {
    const aIsNotSupported = 'isNotSupported' in a && !!a.isNotSupported
    const bIsNotSupported = 'isNotSupported' in b && !!b.isNotSupported

    if (aIsNotSupported !== bIsNotSupported) return aIsNotSupported ? 1 : -1

    return compareChainIdsByBalance(a.chainId.toString(), b.chainId.toString(), balancePerNetwork)
  })

export { compareChainIdsByBalance, networkSort, sortNetworksByBalance }
