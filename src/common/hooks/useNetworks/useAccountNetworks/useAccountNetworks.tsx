import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { isAmbireV1LinkedAccount } from '@ambire-common/libs/account/account'
import useController from '@common/hooks/useController'

/**
 * Hook for getting the account supported networks.
 * EOA  : all of them
 * V1   : if the network has relayer
 * V2   : if the contracts are deployed and we either have a relayer or 4337
 * Safe : if the safe account is deployed on the network
 */
const useAccountNetworks = ({
  accAddr,
  isSafe,
  factoryAddr
}: {
  accAddr?: string
  isSafe?: boolean
  factoryAddr?: string
}) => {
  const {
    state: { accountStates }
  } = useController('AccountsController')
  const { state: networks } = useController('NetworksController', (state) => state.networks)
  const { t } = useTranslation()

  const accountNetworks = useMemo(() => {
    if (!accAddr) return []

    // NOT a [Gnosis] Safe account
    if (!isSafe) {
      // EOA
      if (!factoryAddr) return networks

      // v1 SA
      if (isAmbireV1LinkedAccount(factoryAddr)) {
        // v1s don't work without the relayer
        return networks.filter((network) => !!network.hasRelayer)
      }

      // v2 SA
      return networks.filter(
        (network) => network.areContractsDeployed && (network.hasRelayer || network.erc4337.enabled)
      )
    }
    if (!accountStates[accAddr]) return []

    return networks.filter((n) => {
      const networkAccState = accountStates[accAddr]?.[n.chainId.toString()]
      if (!networkAccState) return true
      return networkAccState.isDeployed
    })
  }, [accAddr, isSafe, factoryAddr, accountStates, networks])

  const accountNotSupportedReason = useMemo(() => {
    if (!accAddr) return ''
    if (!isSafe) {
      if (!factoryAddr) return '' // EOA
      if (isAmbireV1LinkedAccount(factoryAddr)) {
        return t('Ambire v1 accounts are not supported on this network')
      }
      // v2
      return t('Ambire smart accounts are not supported on this network')
    }
    // safe
    return t('Safe account is not activated on this network')
  }, [accAddr, isSafe, factoryAddr, t])

  return { accountNetworks, accountNotSupportedReason }
}

export default useAccountNetworks
