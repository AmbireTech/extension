import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AddressState, AddressStateOptional } from '@ambire-common/interfaces/domains'
import { resolveENSDomain } from '@ambire-common/services/ensDomains'
import { resolveUDomain } from '@ambire-common/services/unstoppableDomains'
import { ToastOptions } from '@common/contexts/toastContext'

import getAddressInputValidation from './utils/validation'

interface Props {
  addressState: AddressState
  setAddressState: (newState: AddressStateOptional) => void
  overwriteError?: string
  overwriteValidLabel?: string
  addToast: (message: string, options?: ToastOptions) => void
  handleCacheResolvedDomain: (address: string, domain: string, type: 'ens' | 'ud') => void
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
  addToast,
  handleCacheResolvedDomain,
  handleRevalidate
}: Props) => {
  const fieldValueRef = useRef(addressState.fieldValue)
  const fieldValue = addressState.fieldValue
  const [debouncedValidation, setDebouncedValidation] = useState({
    isError: true,
    message: ''
  })

  const validation = useMemo(
    () =>
      getAddressInputValidation({
        address: addressState.fieldValue,
        isRecipientDomainResolving: addressState.isDomainResolving,
        isValidEns: !!addressState.ensAddress,
        isValidUDomain: !!addressState.udAddress,
        overwriteError,
        overwriteValidLabel
      }),
    [
      addressState.fieldValue,
      addressState.isDomainResolving,
      addressState.ensAddress,
      addressState.udAddress,
      overwriteError,
      overwriteValidLabel
    ]
  )

  const resolveDomains = useCallback(
    (trimmedAddress: string) => {
      let ensAddress = ''
      let udAddress = ''

      Promise.all([
        resolveUDomain(trimmedAddress)
          .then((newUDAddress: string) => {
            udAddress = newUDAddress

            // Don't save the resolved UD address because it won't be used anywhere for now
            // https://github.com/AmbireTech/ambire-app/issues/2681#issuecomment-2299460748
          })
          .catch(() => {
            udAddress = ''
            addToast('Something went wrong while resolving Unstoppable domains® domain.', {
              type: 'error'
            })
          }),
        resolveENSDomain(trimmedAddress)
          .then((newEnsAddress: string) => {
            ensAddress = newEnsAddress

            if (ensAddress) {
              handleCacheResolvedDomain(ensAddress, fieldValue, 'ens')
            }
          })
          .catch(() => {
            ensAddress = ''
            addToast('Something went wrong while resolving Ethereum Name Services® domain.', {
              type: 'error'
            })
          })
      ])
        .catch(() => {
          ensAddress = ''
          udAddress = ''
          addToast('Something went wrong while resolving domain.', { type: 'error' })
        })
        .finally(() => {
          // The promises may resolve after the component is unmounted.
          if (fieldValueRef.current !== fieldValue) return

          setAddressState({
            ensAddress,
            udAddress,
            isDomainResolving: false
          })
        })
    },
    [addToast, handleCacheResolvedDomain, fieldValue, setAddressState]
  )

  useEffect(() => {
    const { isError, message: latestMessage } = validation
    const { isError: debouncedIsError, message: debouncedMessage } = debouncedValidation

    if (latestMessage === debouncedMessage) return

    const shouldDebounce =
      // Both validations are errors
      isError === debouncedIsError &&
      // There is no UD or ENS address
      !addressState.ensAddress &&
      !addressState.udAddress &&
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
    addressState.udAddress,
    debouncedValidation,
    debouncedValidation.isError,
    debouncedValidation.message,
    validation
  ])

  useEffect(() => {
    const trimmedAddress = fieldValue.trim()
    const dotIndexInAddress = trimmedAddress.indexOf('.')
    // There is a dot and it is not the first or last character
    const canBeEnsOrUd =
      dotIndexInAddress !== -1 &&
      dotIndexInAddress !== 0 &&
      dotIndexInAddress !== trimmedAddress.length - 1

    if (!trimmedAddress || !canBeEnsOrUd) {
      setAddressState({
        ensAddress: '',
        udAddress: '',
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
  }, [handleRevalidate, debouncedValidation])

  const reset = useCallback(() => {
    setAddressState({
      fieldValue: '',
      ensAddress: '',
      udAddress: '',
      isDomainResolving: false
    })
  }, [setAddressState])

  const RHFValidate = useCallback(() => {
    // Disable the form if the address is not the same as the debounced address
    // This disables the submit button in the delay window
    if (validation.message !== debouncedValidation?.message) return false
    // Disable the form if there is an error
    if (debouncedValidation?.isError) return debouncedValidation.message

    if (addressState.isDomainResolving) return false

    return true
  }, [
    addressState.isDomainResolving,
    debouncedValidation?.isError,
    debouncedValidation.message,
    validation.message
  ])

  return {
    validation: debouncedValidation,
    RHFValidate,
    resetAddressInput: reset,
    address: addressState.ensAddress || addressState.udAddress || fieldValue
  }
}

export default useAddressInput
