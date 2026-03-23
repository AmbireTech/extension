import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Account } from '@ambire-common/interfaces/account'
import { Network, SupportedNetworks } from '@ambire-common/interfaces/network'
import useController from '@common/hooks/useController'

import useAccountNetworks from './useAccountNetworks'

/**
 * This returns all enabled networks in the extension with
 * a disabled flag & reason for those that are not supported
 * by the account OR the swap and bridge provider
 */
const useNetworks = ({
  acc,
  getAdditionalNotSupportedReason
}: {
  acc?: Account | null
  getAdditionalNotSupportedReason?: (network: Network) => string | null
}) => {
  const { state: networks } = useController('NetworksController', (state) => state.networks)
  const { accountNetworks, accountNotSupportedReason } = useAccountNetworks({ acc })
  const { t } = useTranslation()

  const accountNetworkChainIds = useMemo(() => {
    return accountNetworks.map((n) => n.chainId)
  }, [accountNetworks])

  const supportedNetworks = useMemo(() => {
    // make a shallow copy of each object in networks
    // below, we are mutating simple properties so a shallow copy is enough
    const finalNetworks: SupportedNetworks[] = networks.map((n) => ({ ...n }))
    return finalNetworks.map((n) => {
      if (!accountNetworkChainIds.includes(n.chainId)) {
        n.isNotSupported = true
        n.notSupportedReason = accountNotSupportedReason
        return n
      }

      if (!!getAdditionalNotSupportedReason) {
        const additionalNotSupportedReason = getAdditionalNotSupportedReason(n)
        if (additionalNotSupportedReason) {
          n.isNotSupported = true
          n.notSupportedReason = t(additionalNotSupportedReason)
          return n
        }
      }

      return n
    })
  }, [
    accountNetworkChainIds,
    networks,
    accountNotSupportedReason,
    getAdditionalNotSupportedReason,
    t
  ])

  return supportedNetworks
}

export default useNetworks
