import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

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
const useAccountNetworks = ({ acc }: { acc?: Account | null }) => {
  const {
    state: { accountStates },
    dispatch: accountsDispatch
  } = useController('AccountsController')
  const { state: networks } = useController('NetworksController', (state) => state.networks)
  const { t } = useTranslation()

  // safe accounts are dependant on the account state so be sure to fetch it
  // if it's not already fetched
  useEffect(() => {
    if (!acc || !acc.safeCreation || !!accountStates[acc.addr]) return

    accountsDispatch({
      type: 'method',
      params: {
        method: 'updateAccountState',
        args: [acc.addr, 'latest']
      }
    })
  }, [acc, accountStates, accountsDispatch])

  const accountNetworks = useMemo(() => {
    if (!acc) return []

    // NOT a [Gnosis] Safe account
    if (!acc.safeCreation) {
      // EOA
      if (!acc.creation) return networks

      // v1 SA
      if (isAmbireV1LinkedAccount(acc.creation.factoryAddr)) {
        // v1s don't work without the relayer
        return networks.filter((network) => !!network.hasRelayer)
      }

      // v2 SA
      return networks.filter(
        (network) => network.areContractsDeployed && (network.hasRelayer || network.erc4337.enabled)
      )
    }
    if (!accountStates[acc.addr]) return networks

    return networks.filter((n) => {
      const networkAccState = accountStates[acc.addr]?.[n.chainId.toString()]
      if (!networkAccState) return true
      return networkAccState.isDeployed
    })
  }, [acc, accountStates, networks])

  const accountNotSupportedReason = useMemo(() => {
    if (!acc?.addr) return ''
    if (!acc.safeCreation) {
      if (!acc.creation) return '' // EOA
      if (isAmbireV1LinkedAccount(acc.creation.factoryAddr)) {
        return t('Ambire v1 accounts are not supported on this network')
      }
      // v2
      return t('Ambire smart accounts are not supported on this network')
    }
    // safe
    return t('Safe account is not activated on this network')
  }, [acc, t])

  return { accountNetworks, accountNotSupportedReason }
}

export default useAccountNetworks
