import { getAddress } from 'ethers'

import { isValidAddress } from '@ambire-common/services/address'
import { Validation } from '@ambire-common/services/validations'

type AddressInputValidation = {
  address: string
  isRecipientDomainResolving: boolean
  isValidEns: boolean
  hasDomainResolveFailed: boolean
  overwriteValidation?: Validation | null
}

/**
 * Mixes basic address/ens validation with an optional overwrite validation.
 * - basic validation - is the address valid? Is ENS resolving?
 * - overwrite validation - custom situation based validation - e.g. the address is already in the address book
 *
 * Rules:
 * Allow overwrites only if the basic validation passes (success).
 * The overwrite validation can be of any severity.
 */
const getAddressInputValidation = ({
  address,
  isRecipientDomainResolving,
  hasDomainResolveFailed = false,
  isValidEns,
  overwriteValidation
}: AddressInputValidation): Validation => {
  if (!address) {
    return {
      message: '',
      severity: 'error'
    }
  }

  // Domain resolution is of highest priority
  if (isRecipientDomainResolving) {
    return {
      message: 'Resolving domain...',
      severity: 'info',
      id: 'resolving_domain'
    }
  }

  if (hasDomainResolveFailed) {
    return {
      // Change ENS to domain if we add more resolvers (like Unstoppable Domains)
      message: 'Failed to resolve ENS. Please try again later or enter a hex address.',
      severity: 'error'
    }
  }

  let successValidation: Validation | null = null

  if (address && isValidAddress(address)) {
    try {
      getAddress(address)

      successValidation = {
        message: 'Valid address',
        severity: 'success'
      }
    } catch {
      return {
        message: 'Invalid checksum. Verify the address and try again.',
        severity: 'error'
      }
    }
  }

  if (isValidEns) {
    successValidation = {
      message: 'Valid ENS domain',
      severity: 'success'
    }
  } else if (address && !isValidAddress(address)) {
    return {
      message: 'Please enter a valid address or ENS domain',
      severity: 'error'
    }
  }

  return (
    // The validation has passed at this point so we allow overwrites
    overwriteValidation ||
    successValidation || {
      message: '',
      severity: 'error'
    }
  )
}

export default getAddressInputValidation
