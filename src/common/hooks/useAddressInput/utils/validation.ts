import { getAddress } from 'ethers'

import { isValidAddress } from '@ambire-common/services/address'
import { getNameService, NameServiceId } from '@ambire-common/services/nameResolvers'
import { Validation } from '@ambire-common/services/validations'

const NAME_SERVICE_LABELS: Record<NameServiceId, string> = {
  ens: 'ENS',
  namoshi: 'Namoshi',
  gns: 'GNS'
}

type AddressInputValidation = {
  address: string
  isRecipientDomainResolving: boolean
  resolvedAddressType: NameServiceId | null
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
  resolvedAddressType,
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
    const serviceLabel = NAME_SERVICE_LABELS[getNameService(address)?.id ?? 'ens']

    return {
      message: `Failed to resolve ${serviceLabel} domain. Please try again later or enter a hex address.`,
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

  // ENS/Namoshi that looks like an address
  if (
    resolvedAddressType &&
    address.indexOf('.') !== -1 &&
    isValidAddress(address.split('.')[0] || '')
  ) {
    return {
      message: `This ${NAME_SERVICE_LABELS[resolvedAddressType]} name may not point to the address you expect. Double-check before sending.`,
      severity: 'warning'
    }
  }

  if (resolvedAddressType) {
    successValidation = {
      message: `Valid ${NAME_SERVICE_LABELS[resolvedAddressType]} domain`,
      severity: 'success'
    }
  } else if (address && !isValidAddress(address)) {
    return {
      message: 'Please enter a valid address or ENS/Namoshi domain',
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
