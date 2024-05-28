import { getAddress } from 'ethers'

import { isValidAddress } from '@ambire-common/services/address'

type AddressInputValidation = {
  debouncedAddress: string
  address: string
  isRecipientDomainResolving: boolean
  isValidUDomain: boolean
  isValidEns: boolean
  overwriteError?: string | boolean
  overwriteValidLabel?: string
}

const getAddressInputValidation = ({
  debouncedAddress,
  address,
  isRecipientDomainResolving,
  isValidUDomain,
  isValidEns,
  overwriteError,
  overwriteValidLabel
}: AddressInputValidation): {
  message: any
  isError: boolean
} => {
  if (!address) {
    return {
      message: '',
      isError: true
    }
  }
  if (isRecipientDomainResolving) {
    return {
      message: 'Resolving domain...',
      isError: false
    }
  }

  // Return error from props if it's passed
  if (overwriteError) {
    return {
      message: overwriteError,
      isError: true
    }
  }
  // Return valid label from props if it's passed
  if (overwriteValidLabel) {
    return {
      message: overwriteValidLabel,
      isError: false
    }
  }
  if (isValidUDomain) {
    return {
      message: 'Valid Unstoppable domainsⓇ domain',
      isError: false
    }
  }
  if (isValidEns) {
    return {
      message: 'Valid Ethereum Name ServicesⓇ domain',
      isError: false
    }
  }
  if (address && isValidAddress(address)) {
    try {
      getAddress(address)
      return {
        message: 'Valid address',
        isError: false
      }
    } catch {
      return {
        message: 'Invalid checksum. Verify the address and try again.',
        isError: true
      }
    }
  }
  if (address && !isValidAddress(address) && address === debouncedAddress) {
    return {
      message: 'Please enter a valid address or ENS/UD domain',
      isError: true
    }
  }

  return {
    message: '',
    isError: true
  }
}

export default getAddressInputValidation
