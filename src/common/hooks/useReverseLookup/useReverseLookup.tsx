import { useEffect, useMemo } from 'react'

import { ReverseLookupOptions } from '@ambire-common/interfaces/domains'
import { getPrimaryName, NameServiceId } from '@ambire-common/services/nameResolvers'
import { getAddressCaught } from '@ambire-common/utils/getAddressCaught'
import useController from '@common/hooks/useController'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

interface Props {
  address: string
  /**
   * How to choose the right mode (defaults to `whenStale`):
   * - whenStale: Used for security-sensitive contexts (e.g., account import, humanizer etc.). Keeps ENS data up to date by refreshing past the TTL
   * - never: Used primarily for lists of addresses (e.g., account select) where we don't want to make batch requests, which would be a privacy concern (allows the association of accounts)
   *
   * Read more in the domains controller
   */
  privacyUpdateMode?: ReverseLookupOptions['privacyUpdateMode']
}

export interface ReverseLookupResult {
  isLoading: boolean
  name: string | null | undefined
  type: NameServiceId | null
  updatedAt: number | undefined
  // Whether a reverse lookup has ever been stored for this address (regardless of whether it resolved a name)
  isFetched: boolean
}

const useReverseLookup = ({
  address,
  privacyUpdateMode = 'whenStale'
}: Props): ReverseLookupResult => {
  const checksummedAddress = useMemo(() => getAddressCaught(address), [address])

  const selectAddressInDomains = useMemo(
    () => (state: AllControllersMappingType['DomainsController']) =>
      state.domains[checksummedAddress],
    [checksummedAddress]
  )
  const selectIsLoading = useMemo(
    () => (state: AllControllersMappingType['DomainsController']) =>
      state.loadingAddresses.includes(checksummedAddress),
    [checksummedAddress]
  )
  const { state: addressInDomains } = useController('DomainsController', selectAddressInDomains)
  const { state: isLoading, dispatch } = useController('DomainsController', selectIsLoading)

  useEffect(() => {
    if (!checksummedAddress || isLoading || privacyUpdateMode === 'never') return

    dispatch({
      type: 'method',
      params: {
        method: 'reverseLookup',
        args: [checksummedAddress, true, { privacyUpdateMode }]
      }
    })
  }, [checksummedAddress, isLoading, dispatch, privacyUpdateMode])

  const primary = getPrimaryName(addressInDomains?.names)

  return {
    isLoading: isLoading || (!addressInDomains && privacyUpdateMode !== 'never'),
    name: primary?.name,
    type: primary?.id ?? null,
    updatedAt: addressInDomains?.updatedAt,
    isFetched: !!addressInDomains
  }
}

export default useReverseLookup
