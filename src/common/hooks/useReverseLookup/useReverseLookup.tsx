import { useEffect } from 'react'

import { ReverseLookupOptions } from '@ambire-common/interfaces/domains'
import { getAddressCaught } from '@ambire-common/utils/getAddressCaught'
import useController from '@common/hooks/useController'

interface Props {
  address: string
  /**
   * How to choose the right mode (defaults to `whenStale`):
   * - whenStale: Used for security-sensitive contexts (e.g., account import, humanizer etc.). Keeps ENS data up to date by refreshing past the TTL
   * - ifMissing: Used for non-security-sensitive contexts (e.g., transaction history). Resolves once if never resolved, then serves from cache regardless of age
   * - never: Used primarily for lists of addresses (e.g., account select) where we don't want to make batch requests, which would be a privacy concern (allows the association of accounts)
   *
   * Read more in the domains controller
   */
  privacyUpdateMode?: ReverseLookupOptions['privacyUpdateMode']
}

export interface ReverseLookupResult {
  isLoading: boolean
  name: string | null | undefined
  type: 'ens' | 'namoshi' | null
}

const useReverseLookup = ({
  address,
  privacyUpdateMode = 'whenStale'
}: Props): ReverseLookupResult => {
  const checksummedAddress = getAddressCaught(address)

  const {
    state: { domains, loadingAddresses },
    dispatch
  } = useController('DomainsController')
  const isLoading = loadingAddresses.includes(checksummedAddress)
  const addressInDomains = domains[checksummedAddress]
  useEffect(() => {
    if (!checksummedAddress || isLoading) return

    dispatch({
      type: 'method',
      params: {
        method: 'reverseLookup',
        args: [checksummedAddress, true, { privacyUpdateMode }]
      }
    })
  }, [checksummedAddress, addressInDomains, isLoading, dispatch, privacyUpdateMode])

  return {
    isLoading: isLoading || (!addressInDomains && privacyUpdateMode !== 'never'),
    name: addressInDomains?.ens || addressInDomains?.namoshi,
    type: addressInDomains?.ens ? 'ens' : addressInDomains?.namoshi ? 'namoshi' : null
  }
}

export default useReverseLookup
