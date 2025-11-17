import { getAddress } from 'ethers'

import { isValidAddress } from '@ambire-common/services/address'

export type ValidationWithSeverityType = {
  message: string
  isError: boolean
  severity?: 'error' | 'warning' | 'info'
}

type AddressInputValidation = {
  address: string
  isRecipientDomainResolving: boolean
  isValidEns: boolean
  hasDomainResolveFailed: boolean
  overwriteError?: string
  overwriteValidLabel?: string
  overwriteSeverity?: 'error' | 'warning' | 'info'
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
      severity: overwriteSeverity || 'error'
    }
  }

  if (address && isValidAddress(address)) {
    try {
      if (address !== getAddress(address)) {
        return {
          message: 'Invalid checksum. Verify the address and try again.',
          isError: true,
          severity: overwriteSeverity || 'error'
        }
      }
    } catch {
      return {
        message: 'Invalid checksum. Verify the address and try again.',
        isError: true,
        severity: overwriteSeverity || 'error'
      }
    }
  }
  if (address && !isValidAddress(address)) {
    return {
      message: 'Please enter a valid address or ENS domain',
      isError: true,
      severity: overwriteSeverity || 'error'
    }
  }

  if (isRecipientDomainResolving) {
    return {
      message: 'Resolving domain...',
      isError: false,
      severity: overwriteSeverity || 'warning'
    }
  }

  // Return error from props if it's passed
  if (overwriteError) {
    return {
      message: overwriteError,
      isError: true,
      severity: overwriteSeverity || 'error'
    }
  }
  // Return valid label from props if it's passed
  if (overwriteValidLabel) {
    return {
      message: overwriteValidLabel,
      isError: false,
      severity: overwriteSeverity || 'warning'
    }
  }
  if (hasDomainResolveFailed) {
    return {
      // Change ENS to domain if we add more resolvers
      message: 'Failed to resolve ENS. Please try again later or enter a hex address.',
      isError: true,
      severity: overwriteSeverity || 'error'
    }
  }
  if (isValidEns) {
    return {
      message: 'Valid ENS domain',
      isError: false,
      severity: overwriteSeverity || 'warning'
    }
  }

  return {
    message: '',
    isError: true,
    severity: overwriteSeverity || 'error'
  }
}

export default getAddressInputValidation
