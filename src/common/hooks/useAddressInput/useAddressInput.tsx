import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AddressState, AddressStateOptional } from '@ambire-common/interfaces/domains'
import { Validation } from '@ambire-common/services/validations'

import useResolveDomain from '../useResolveDomain'
import getAddressInputValidation from './utils/validation'

interface Props {
  addressState: AddressState
  /**
   * Used to overwrite the address state field value that is
   * used for validation. Because there is controller state (which takes a while to update)
   * and useState state (which is updated instantly), and the useState state is used
   * for ENS resolution, we may want to delay the validation until the controller state
   * is updated.
   */
  overwriteValidationFieldValue?: string
  setAddressState: (newState: AddressStateOptional) => void
  /**
   * Used to overwrite the default validation logic.
   * Example: preventing adding an address that is already in the address book.
   */
  overwriteValidation?: Validation | null
  // handleRevalidate is required when the address input is used
  // together with react-hook-form. It is used to trigger the revalidation of the input.
  // !!! Must be memoized with useCallback
  handleRevalidate?: () => void
}

const useAddressInput = ({
  addressState,
  setAddressState,
  overwriteValidation,
  overwriteValidationFieldValue,
  handleRevalidate
}: Props) => {
  const fieldValueRef = useRef(addressState.fieldValue)
  const fieldValue = addressState.fieldValue
  const [hasDomainResolveFailed, setHasDomainResolveFailed] = useState(false)
  const { resolveDomain } = useResolveDomain()
  const [debouncedValidation, setDebouncedValidation] = useState<Validation>({
    severity: 'error',
    message: ''
  })

  const validation = useMemo(
    () =>
      getAddressInputValidation({
        address: overwriteValidationFieldValue ?? fieldValue,
        isRecipientDomainResolving: addressState.isDomainResolving,
        isValidEns: !!addressState.ensAddress,
        hasDomainResolveFailed,
        overwriteValidation
      }),
    [
      overwriteValidationFieldValue,
      fieldValue,
      addressState.isDomainResolving,
      addressState.ensAddress,
      hasDomainResolveFailed,
      overwriteValidation
    ]
  )

  useEffect(() => {
    const { message: latestMessage, severity } = validation
    const { message: debouncedMessage, severity: debouncedSeverity } = debouncedValidation

    if (latestMessage === debouncedMessage && severity === debouncedSeverity) return

    const shouldDebounce =
      // Both validations are errors
      severity === 'error' &&
      debouncedSeverity === 'error' &&
      // There is no ENS address
      !addressState.ensAddress &&
      // The message is not empty
      latestMessage

    // If debouncing is not required, instantly update
    if (!shouldDebounce) {
      setDebouncedValidation(validation)
      return
    }

    const timeout = setTimeout(() => {
      setDebouncedValidation(validation)
    }, 500)

    return () => {
      clearTimeout(timeout)
    }
  }, [
    addressState.ensAddress,
    debouncedValidation,
    debouncedValidation.severity,
    debouncedValidation.message,
    validation
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
      resolveDomain({ domain: trimmedAddress })
        .then((ensAddress) => {
          if (fieldValueRef.current !== fieldValue) return
          setAddressState({ ensAddress, isDomainResolving: false })
        })
        .catch(() => {
          if (fieldValueRef.current !== fieldValue) return

          setHasDomainResolveFailed(true)
          setAddressState({ ensAddress: '', isDomainResolving: false })
        })
    }, 300)

    return () => {
      clearTimeout(timeout)
    }
  }, [fieldValue, setAddressState, resolveDomain])

  useEffect(() => {
    fieldValueRef.current = addressState.fieldValue
  }, [addressState.fieldValue])

  useEffect(() => {
    if (!handleRevalidate) return

    handleRevalidate()
  }, [handleRevalidate, debouncedValidation, validation.message])

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
    if (validation.message !== debouncedValidation?.message) return false

    // Disable the form if the address is resolving
    if (debouncedValidation.id === 'resolving_domain') {
      return false
    }

    // Disable the form if there is an error
    if (debouncedValidation?.severity === 'error')
      return !(debouncedValidation?.severity === 'error') && debouncedValidation.message === ''

    if (addressState.isDomainResolving) return false

    return true
  }, [
    addressState.isDomainResolving,
    debouncedValidation.id,
    debouncedValidation.message,
    debouncedValidation?.severity,
    validation.message
  ])

  return {
    validation: debouncedValidation,
    RHFValidate,
    resetAddressInput: reset,
    address: addressState.ensAddress || fieldValue
  }
}

export default useAddressInput
