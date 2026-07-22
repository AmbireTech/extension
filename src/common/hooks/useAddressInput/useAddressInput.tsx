import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AddressState, AddressStateOptional } from '@ambire-common/interfaces/domains'
import { Validation } from '@ambire-common/services/validations'
import { getAddressFromAddressState } from '@ambire-common/utils/domains'

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
  isDomainVerifiedByColibri?: boolean
  // handleRevalidate is required when the address input is used
  // together with react-hook-form. It is used to trigger the revalidation of the input.
  // !!! Must be memoized with useCallback
  handleRevalidate?: () => void
}

const useAddressInput = ({
  addressState,
  setAddressState,
  overwriteValidation,
  isDomainVerifiedByColibri,
  overwriteValidationFieldValue,
  handleRevalidate
}: Props) => {
  // Used to prevent updating state when the field value has changed before the resolution promise is resolved
  const latestFieldValueRef = useRef(addressState.fieldValue)
  // Used to prevent recalculations for the same field value (e.g., the component re-rendered but the user didn't change the input)
  // MUST be reset after the field value changes. Otherwise the following scenario may happen:
  // 1. Resolution completes, the ref is set
  // 2. The user changes the input, but the ref is not reset yet
  // 3. The user changes back to the original value while loading, the ref prevents the resolution from happening again, even though it should
  // 4. The user is stuck with the error from 2.
  const lastResolvedFieldValueRef = useRef<string | null>(null)
  const fieldValue = addressState.fieldValue
  const [hasDomainResolveFailed, setHasDomainResolveFailed] = useState(false)
  const [domainResolveError, setDomainResolveError] = useState('')
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
        resolvedAddressType: addressState.resolvedAddressType,
        isDomainVerifiedByColibri,
        hasDomainResolveFailed,
        domainResolveError,
        overwriteValidation
      }),
    [
      overwriteValidationFieldValue,
      fieldValue,
      addressState.isDomainResolving,
      addressState.resolvedAddressType,
      isDomainVerifiedByColibri,
      hasDomainResolveFailed,
      domainResolveError,
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
      // There is no resolved address
      !addressState.resolvedAddress &&
      // The message is not empty
      latestMessage

    // If debouncing is not required, instantly update
    if (!shouldDebounce) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    debouncedValidation,
    debouncedValidation.severity,
    debouncedValidation.message,
    validation,
    addressState.resolvedAddress
  ])

  useEffect(() => {
    if (lastResolvedFieldValueRef.current && lastResolvedFieldValueRef.current === fieldValue)
      return
    const trimmedAddress = fieldValue.trim()
    const dotIndexInAddress = trimmedAddress.indexOf('.')
    // There is a dot and it is not the first or last character
    const canBeDomain =
      dotIndexInAddress !== -1 &&
      dotIndexInAddress !== 0 &&
      dotIndexInAddress !== trimmedAddress.length - 1

    setHasDomainResolveFailed(false)
    setDomainResolveError('')

    if (!trimmedAddress || !canBeDomain) {
      setAddressState({
        resolvedAddress: '',
        resolvedAddressType: null,
        isDomainResolving: false
      })
      return
    }

    setAddressState({
      isDomainResolving: true
    })

    // Debounce domain resolving
    const timeout = setTimeout(() => {
      // Must be set here, not before the timer — guard on line 107 must only block re-runs while the Promise is in-flight, not during the debounce window.
      resolveDomain({ domain: trimmedAddress })
        .then((result) => {
          if (latestFieldValueRef.current !== fieldValue) return
          setAddressState({
            fieldValue,
            resolvedAddress: result?.address || '',
            resolvedAddressType: result?.type || null,
            isDomainResolving: false
          })
          lastResolvedFieldValueRef.current = fieldValue
        })
        .catch((error) => {
          if (latestFieldValueRef.current !== fieldValue) return

          setHasDomainResolveFailed(true)
          setDomainResolveError(error?.message || '')
          setAddressState({
            fieldValue,
            resolvedAddress: '',
            resolvedAddressType: null,
            isDomainResolving: false
          })

          lastResolvedFieldValueRef.current = fieldValue
        })
    }, 300)

    return () => {
      clearTimeout(timeout)
    }
  }, [fieldValue, setAddressState, resolveDomain])

  useEffect(() => {
    latestFieldValueRef.current = addressState.fieldValue

    if (
      lastResolvedFieldValueRef.current &&
      addressState.fieldValue !== lastResolvedFieldValueRef.current
    ) {
      lastResolvedFieldValueRef.current = null
    }
  }, [addressState.fieldValue])

  useEffect(() => {
    if (!handleRevalidate) return

    handleRevalidate()
  }, [handleRevalidate, debouncedValidation, validation.message])

  const reset = useCallback(() => {
    setAddressState({
      fieldValue: '',
      resolvedAddress: '',
      resolvedAddressType: null,
      isDomainResolving: false
    })
  }, [setAddressState])

  // react-hook-form must work with the latest validation, otherwise
  // the component may rerender with the old validation
  // (e.g., showing an error message that is no longer relevant after the user has changed the input)
  const RHFValidate = useCallback(() => {
    // Disable the form if the resolved data is for another field value
    // e.g., the user just changed the input
    if (latestFieldValueRef.current && fieldValue !== latestFieldValueRef.current) return false

    // Disable the form if the address is resolving
    if (validation.id === 'resolving_domain') {
      return false
    }

    // Disable the form if there is an error
    if (validation.severity === 'error')
      return !(validation.severity === 'error') && validation.message === ''

    if (addressState.isDomainResolving) return false

    return true
  }, [
    addressState.isDomainResolving,
    fieldValue,
    validation.id,
    validation.message,
    validation.severity
  ])

  return {
    validation: debouncedValidation,
    RHFValidate,
    resetAddressInput: reset,
    address: getAddressFromAddressState(addressState)
  }
}

export default useAddressInput
