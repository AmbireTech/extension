import { useEffect } from 'react'

import { getAddressCaught } from '@ambire-common/utils/getAddressCaught'
import useDomainsControllerState from '@web/hooks/useDomainsController/useDomainsController'

interface Props {
  address: string
}

const useReverseLookup = ({ address }: Props) => {
  const checksummedAddress = getAddressCaught(address)

  const {
    state: { domains, loadingAddresses },
    resolveDomain
  } = useDomainsControllerState()
  const isLoading = loadingAddresses.includes(checksummedAddress)
  const addressInDomains = domains[checksummedAddress]

  useEffect(() => {
    if (!checksummedAddress || addressInDomains || isLoading) return

    resolveDomain(checksummedAddress)
  }, [checksummedAddress, addressInDomains, isLoading, resolveDomain])

  return {
    isLoading: isLoading || !addressInDomains,
    ens: addressInDomains?.ens
  }
}

export default useReverseLookup
