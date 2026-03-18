import { useMemo } from 'react'

import { Account } from '@ambire-common/interfaces/account'
import { isAmbireV1LinkedAccount } from '@ambire-common/libs/account/account'
import useController from '@common/hooks/useController'

/**
 * Hook for getting the account supported networks.
 * EOA  : all of them
 * V1   : if the network has relayer
 * V2   : if the contracts are deployed and we either have a relayer or 4337
 * Safe : if the safe account is deployed on the network
 */
const useNetworks = ({ account }: { account?: Account | null }) => {
  const {
    state: { accountStates }
  } = useController('AccountsController')
  const { state: networks } = useController('NetworksController', (state) => state.networks)

  const supportedNetworks = useMemo(() => {
    if (!account) return []

    // NOT a [Gnosis] Safe account
    if (!account.safeCreation) {
      // EOA
      if (!account?.creation) return networks

      // v1 SA
      if (isAmbireV1LinkedAccount(account.creation.factoryAddr)) {
        // v1s don't work without the relayer
        return networks.filter((network) => !!network.hasRelayer)
      }

      // v2 SA
      return networks.filter(
        (network) => network.areContractsDeployed && (network.hasRelayer || network.erc4337.enabled)
      )
    }
    if (!accountStates[account.addr]) return []

    return networks.filter((n) => {
      const networkAccState = accountStates[account.addr]?.[n.chainId.toString()]
      if (!networkAccState) return true
      return networkAccState.isDeployed
    })
  }, [account, accountStates, networks])

  return supportedNetworks
}

export default useNetworks
