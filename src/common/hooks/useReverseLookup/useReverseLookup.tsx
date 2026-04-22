import { useEffect } from 'react'

import { getAddressCaught } from '@ambire-common/utils/getAddressCaught'
import useController from '@common/hooks/useController'

interface Props {
  address: string
}

export interface ReverseLookupResult {
  isLoading: boolean
  name: string | null | undefined
  type: 'ens' | 'namoshi' | null
}

const useReverseLookup = ({ address }: Props): ReverseLookupResult => {
  const checksummedAddress = getAddressCaught(address)

  const {
    state: { domains, loadingAddresses },
    dispatch
  } = useController('DomainsController')
  const isLoading = loadingAddresses.includes(checksummedAddress)
  const addressInDomains = domains[checksummedAddress]
  useEffect(() => {
    if (!checksummedAddress || addressInDomains || isLoading) return

    dispatch({
      type: 'method',
      params: { method: 'reverseLookup', args: [checksummedAddress] }
    })
  }, [checksummedAddress, addressInDomains, isLoading, dispatch])

  return {
    isLoading: isLoading || !addressInDomains,
    name: addressInDomains?.ens || addressInDomains?.namoshi,
    type: addressInDomains?.ens ? 'ens' : addressInDomains?.namoshi ? 'namoshi' : null
  }
}

export default useReverseLookup
