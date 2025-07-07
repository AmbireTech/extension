import { useEffect } from 'react'

import { getAddressCaught } from '@ambire-common/utils/getAddressCaught'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useDomainsControllerState from '@web/hooks/useDomainsController/useDomainsController'

interface Props {
  address: string
}

const useReverseLookup = ({ address }: Props) => {
  const checksummedAddress = getAddressCaught(address)
  const { dispatch } = useBackgroundService()
  const { domains, loadingAddresses } = useDomainsControllerState()
  const isLoading = loadingAddresses.includes(checksummedAddress)
  const addressInDomains = domains[checksummedAddress]

  useEffect(() => {
    if (!checksummedAddress || addressInDomains || isLoading) return

    dispatch({
      type: 'DOMAINS_CONTROLLER_REVERSE_LOOKUP',
      params: {
        address: checksummedAddress
      }
    })
  }, [checksummedAddress, addressInDomains, dispatch, isLoading])

  return {
    isLoading: isLoading || !addressInDomains,
    ens: addressInDomains?.ens
  }
}

export default useReverseLookup
