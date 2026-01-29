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
    reverseLookup
  } = useDomainsControllerState()
  const isLoading = loadingAddresses.includes(checksummedAddress)
  const addressInDomains = domains[checksummedAddress]

  useEffect(() => {
    if (!checksummedAddress || addressInDomains || isLoading) return

    reverseLookup(checksummedAddress)
  }, [checksummedAddress, addressInDomains, isLoading, reverseLookup])

  return {
    isLoading: isLoading || !addressInDomains,
    ens: addressInDomains?.ens
  }
}

export default useReverseLookup
