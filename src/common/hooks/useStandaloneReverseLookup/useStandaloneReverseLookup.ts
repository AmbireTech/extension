import { getAddress } from 'ethers'
import { useEffect } from 'react'

import useDomainsContext from '@common/hooks/useDomainsContext'

type Props = {
  address: string
}

/**
 * Performs reverse lookup for a given address.
 * It uses the domains controller initialized in a front-end context,
 * instead of the background service.
 */
const useStandaloneReverseLookup = ({ address }: Props) => {
  const checksummedAddress = getAddress(address)
  const { domainsCtrl, state } = useDomainsContext()

  useEffect(() => {
    if (!checksummedAddress) return

    // Initiate reverse lookup
    domainsCtrl.reverseLookup(checksummedAddress).catch((e) => {
      console.error('Failed to resolve domain for address', checksummedAddress, e)
    })
  }, [checksummedAddress, domainsCtrl])

  return {
    isLoading:
      state.loadingAddresses.includes(checksummedAddress) || !state.domains[checksummedAddress],
    resolvedDomain: state.domains[checksummedAddress] ?? { ens: null },
    ensAvatar: state.domains[checksummedAddress]?.ensAvatar
  }
}

export default useStandaloneReverseLookup
