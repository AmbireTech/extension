import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AddressState, AddressStateOptional } from '@ambire-common/interfaces/domains'
import { resolveENSDomain } from '@ambire-common/services/ensDomains'

import getAddressInputValidation from './utils/validation'

// Expose a `severity` property for non-error validations. We don't change
// the underlying validation util signature — instead map the result here.
type ValidationWithSeverityType = {
  message: string
  isError: boolean
  severity?: 'error' | 'warning' | 'info'
}

interface Props {
  addressState: AddressState
  setAddressState: (newState: AddressStateOptional) => void
  overwriteError?: string
  overwriteValidLabel?: string
  // Severity may be provided by callers (e.g. controller state). Accept
  // 'error'|'warning'|'info' so we can pass it through unchanged.
  overwriteSeverity?: 'error' | 'warning' | 'info'
  handleCacheResolvedDomain: (address: string, domain: string, type: 'ens') => void
  // handleRevalidate is required when the address input is used
  // together with react-hook-form. It is used to trigger the revalidation of the input.
  // !!! Must be memoized with useCallback
  handleRevalidate?: () => void
}

const useAddressInput = ({
  addressState,
  setAddressState,
  overwriteError,
  overwriteValidLabel,
  // For now severity is only used for non-error validations (warnings / info)
  overwriteSeverity,
  handleCacheResolvedDomain,
  handleRevalidate
}: Props) => {
  const fieldValueRef = useRef(addressState.fieldValue)
  const fieldValue = addressState.fieldValue
  const [hasDomainResolveFailed, setHasDomainResolveFailed] = useState(false)
  const [debouncedValidation, setDebouncedValidation] = useState<{
    isError: boolean
    message: string
    severity?: 'error' | 'warning' | 'info'
  }>({
    isError: true,
    message: ''
  })

  const validation = useMemo(
    () =>
      getAddressInputValidation({
        address: addressState.fieldValue,
        isRecipientDomainResolving: addressState.isDomainResolving,
        isValidEns: !!addressState.ensAddress,
        hasDomainResolveFailed,
        overwriteError,
        overwriteValidLabel
      }),
    [
      addressState.fieldValue,
      addressState.isDomainResolving,
      addressState.ensAddress,
      hasDomainResolveFailed,
      overwriteError,
      overwriteValidLabel
    ]
  )

  const validationWithSeverity = useMemo<ValidationWithSeverityType>(() => {
    const base = validation
    // If caller provided an overwriteSeverity, use it to determine both severity and isError
    if (typeof overwriteSeverity !== 'undefined') {
      return {
        ...base,
        severity: overwriteSeverity
      }
    }

    // Default mapping: errors -> 'error', non-errors -> 'warning'. If a
    // caller supplied `overwriteSeverity` we returned early above and it
    // will be used as-is.
    return {
      ...base,
      severity: base.isError ? 'error' : 'warning'
    }
  }, [validation, overwriteSeverity])

  const resolveDomains = useCallback(
    async (trimmedAddress: string) => {
      let ensAddress = ''

      // Keep the promise all as we may add more domain resolvers in the future
      await Promise.all([
        resolveENSDomain(trimmedAddress)
          .then((newEnsAddress: string) => {
            ensAddress = newEnsAddress

            if (ensAddress) {
              handleCacheResolvedDomain(ensAddress, fieldValue, 'ens')
            }
          })
          .catch((e) => {
            if (fieldValueRef.current !== fieldValue) return

            setHasDomainResolveFailed(true)
            ensAddress = ''
            console.error('Failed to resolve ENS domain:', e)
          })
      ])

      // The promises may resolve after the component is unmounted.
      if (fieldValueRef.current !== fieldValue) return

      setAddressState({
        ensAddress,
        isDomainResolving: false
      })
    },
    [handleCacheResolvedDomain, fieldValue, setAddressState]
  )

  useEffect(() => {
    const { isError, message: latestMessage } = validationWithSeverity
    const { isError: debouncedIsError, message: debouncedMessage } = debouncedValidation

    if (latestMessage === debouncedMessage) return

    const shouldDebounce =
      // Both validations are errors
      isError === debouncedIsError &&
      // There is no ENS address
      !addressState.ensAddress &&
      // The message is not empty
      latestMessage

    // If debouncing is not required, instantly update
    if (!shouldDebounce) {
      setDebouncedValidation(validationWithSeverity)
      return
    }

    const timeout = setTimeout(() => {
      setDebouncedValidation(validationWithSeverity)
    }, 500)

    return () => {
      clearTimeout(timeout)
    }
  }, [
    addressState.ensAddress,
    debouncedValidation,
    debouncedValidation.isError,
    debouncedValidation.message,
    validationWithSeverity
  ])

  useEffect(() => {
    const trimmedAddress = fieldValue.trim()
    const dotIndexInAddress = trimmedAddress.indexOf('.')
    // There is a dot and it is not the first or last character
    const canBeDomain =
      dotIndexInAddress !== -1 &&
      dotIndexInAddress !== 0 &&
      dotIndexInAddress !== trimmedAddress.length - 1

    setHasDomainResolveFailed(false)

    if (!trimmedAddress || !canBeDomain) {
      setAddressState({
        ensAddress: '',
        isDomainResolving: false
      })
      return
    }

    setAddressState({
      isDomainResolving: true
    })

    // Debounce domain resolving
    const timeout = setTimeout(() => {
      resolveDomains(trimmedAddress)
    }, 300)

    return () => {
      clearTimeout(timeout)
    }
  }, [fieldValue, resolveDomains, setAddressState])

  useEffect(() => {
    fieldValueRef.current = addressState.fieldValue
  }, [addressState.fieldValue])

  useEffect(() => {
    if (!handleRevalidate) return

    handleRevalidate()
  }, [handleRevalidate, debouncedValidation, validationWithSeverity.message])

  const reset = useCallback(() => {
    setAddressState({
      fieldValue: '',
      ensAddress: '',
      isDomainResolving: false
    })
  }, [setAddressState])

  const RHFValidate = useCallback(() => {
    // Disable the form if the address is not the same as the debounced address
    // This disables the submit button in the delay window
    if (validationWithSeverity.message !== debouncedValidation?.message) return false

    // Disable the form if the address is resolving
    if (!debouncedValidation?.isError && debouncedValidation.message === 'Resolving domain...') {
      return false
    }

    // Disable the form if there is an error
    if (debouncedValidation?.isError)
      return !debouncedValidation?.isError && debouncedValidation.message === ''

    if (addressState.isDomainResolving) return false

    return true
  }, [
    addressState.isDomainResolving,
    debouncedValidation?.isError,
    debouncedValidation.message,
    validationWithSeverity.message
  ])

  return {
    validation: debouncedValidation,
    RHFValidate,
    resetAddressInput: reset,
    address: addressState.ensAddress || fieldValue
  }
}

export default useAddressInput
