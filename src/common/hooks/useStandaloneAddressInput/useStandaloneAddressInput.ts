import { useCallback, useState } from 'react'

import { AddressState, AddressStateOptional } from '@ambire-common/interfaces/domains'

import useDomainsContext from '../useDomainsContext'

/**
 * To be used in Benzin and Legends. Because useAddressInput is written in a way to work with
 * react-hook-form, controller state and useState we have to write some boilerplate.
 */
const useStandaloneAddressInput = () => {
  const { domainsCtrl } = useDomainsContext()
  const [addressState, setAddressState] = useState<AddressState>({
    isDomainResolving: false,
    fieldValue: '',
    ensAddress: ''
  })
  const setAddressStateKeyValue = useCallback((newState: AddressStateOptional) => {
    Object.keys(newState).forEach((key) => {
      // @ts-ignore
      setAddressState((prev) => ({ ...prev, [key]: newState[key] }))
    })
  }, [])
  const handleCacheResolvedDomain = useCallback(
    (address: string, ensAvatar: string | null, domain: string, type: 'ens') => {
      domainsCtrl.saveResolvedReverseLookup({ address, ensAvatar, name: domain, type })
    },
    [domainsCtrl]
  )

  return {
    addressState,
    setAddressState,
    setAddressStateKeyValue,
    handleCacheResolvedDomain,
    address: addressState.ensAddress || addressState.fieldValue
  }
}

export default useStandaloneAddressInput
