import { getAddress } from 'ethers'

import { isValidAddress } from '@ambire-common/services/address'

export type ValidationWithSeverityType = {
  message: string
  isError: boolean
  severity?: 'error' | 'warning' | 'info' | 'success'
}

type AddressInputValidation = {
  address: string
  isRecipientDomainResolving: boolean
  isValidEns: boolean
  hasDomainResolveFailed: boolean
  overwriteError?: string
  overwriteValidLabel?: string
  overwriteSeverity?: 'error' | 'warning' | 'info' | 'success'
}

const getAddressInputValidation = ({
  address,
  isRecipientDomainResolving,
  hasDomainResolveFailed = false,
  isValidEns,
  overwriteError,
  overwriteValidLabel,
  overwriteSeverity
}: AddressInputValidation): ValidationWithSeverityType => {
  if (!address) {
    return {
      message: '',
      isError: true,
      severity: 'error'
    }
  }

  if (isRecipientDomainResolving) {
    return {
      message: 'Resolving domain...',
      isError: false,
      severity: 'info'
    }
  }

  if (hasDomainResolveFailed) {
    return {
      // Change ENS to domain if we add more resolvers
      message: 'Failed to resolve ENS. Please try again later or enter a hex address.',
      isError: true,
      severity: 'error'
    }
  }

  let validation: ValidationWithSeverityType | null = null

  if (isValidAddress(address)) {
    try {
      getAddress(address)

      validation = {
        message: overwriteValidLabel || 'Valid address',
        isError: false,
        severity: overwriteSeverity || 'success'
      }
    } catch {
      // Return immediately, the address is not valid at all
      return {
        message: 'Invalid checksum. Verify the address and try again.',
        isError: true,
        severity: 'error'
      }
    }
  } else if (!isValidEns) {
    return {
      message: 'Please enter a valid address or ENS domain',
      isError: true,
      severity: 'error'
    }
  }

  if (isValidEns) {
    validation = {
      message: 'Valid ENS domain',
      isError: false,
      severity: 'success'
    }
  }

  if (overwriteError || overwriteValidLabel) {
    return {
      message: overwriteError || overwriteValidLabel || '',
      isError: overwriteSeverity === 'error' || !!overwriteError,
      severity: overwriteSeverity || (overwriteError ? 'error' : 'success')
    }
  }

  return (
    validation || {
      message: '',
      isError: true,
      severity: overwriteSeverity || 'error'
    }
  )
}

export default getAddressInputValidation
