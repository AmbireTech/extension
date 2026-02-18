import { useEffect } from 'react'

import { getAddressCaught } from '@ambire-common/utils/getAddressCaught'
import useController from '@common/hooks/useController'

interface Props {
  address: string
}

const useReverseLookup = ({ address }: Props) => {
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
    ens: addressInDomains?.ens
  }
}

export default useReverseLookup
