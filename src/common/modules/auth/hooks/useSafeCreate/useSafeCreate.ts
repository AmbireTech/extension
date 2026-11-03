import { getAddress, isAddress } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import { AddressState } from '@ambire-common/interfaces/domains'
import { Hex } from '@ambire-common/interfaces/hex'
import { Validation } from '@ambire-common/services/validations'
import { getAddressFromAddressState } from '@ambire-common/utils/domains'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** The values of the Safe create form: one address field per owner */
export type SafeCreateFormValues = {
  owners: AddressState[]
}

const MIN_REQUIRED_CONFIRMATIONS = 1

const EMPTY_OWNER_FIELD_VALUE: AddressState = {
  fieldValue: '',
  resolvedAddress: '',
  resolvedAddressType: null,
  isDomainResolving: false
}

const DEFAULT_FORM_VALUES: SafeCreateFormValues = { owners: [EMPTY_OWNER_FIELD_VALUE] }

/**
 * Returns the indexes of every owner field whose address is also entered in another field.
 * Addresses are compared case-insensitively. Empty fields and incomplete addresses are
 * never duplicates.
 */
const getDuplicateOwnerIndexes = (ownerFieldAddresses: string[]) => {
  const normalizedAddresses = ownerFieldAddresses.map((address) =>
    isAddress(address) ? address.toLowerCase() : ''
  )

  return normalizedAddresses.reduce<number[]>((duplicateIndexes, address, index) => {
    if (!address) return duplicateIndexes

    const isEnteredInAnotherField = normalizedAddresses.some(
      (otherAddress, otherIndex) => otherIndex !== index && otherAddress === address
    )

    return isEnteredInAnotherField ? [...duplicateIndexes, index] : duplicateIndexes
  }, [])
}

const selectCreateSafeAccountStatus = (state: AllControllersMappingType['SafeController']) =>
  state.statuses.createSafeAccount

const useSafeCreate = () => {
  const { t } = useTranslation()
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { state: createSafeAccountStatus, dispatch: safeDispatch } = useController(
    'SafeController',
    selectCreateSafeAccountStatus
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedRequiredConfirmations, setSelectedRequiredConfirmations] = useState(
    MIN_REQUIRED_CONFIRMATIONS
  )
  const {
    control,
    setValue,
    trigger,
    formState: { isValid: areAllOwnerFieldsValid }
  } = useForm<SafeCreateFormValues>({
    mode: 'all',
    defaultValues: DEFAULT_FORM_VALUES
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'owners' })
  const ownerFieldStates = useWatch({ control, name: 'owners' })

  const ownerFieldAddresses = useMemo(
    () => ownerFieldStates.map((ownerFieldState) => getAddressFromAddressState(ownerFieldState)),
    [ownerFieldStates]
  )

  const duplicateOwnerIndexes = useMemo(
    () => getDuplicateOwnerIndexes(ownerFieldAddresses),
    [ownerFieldAddresses]
  )

  /**
   * What each owner field shows on top of its address validation, in the same order as the
   * fields. Covers an owner entered in more than one field.
   */
  const ownerFieldValidations = useMemo<(Validation | null)[]>(
    () =>
      ownerFieldAddresses.map((_, index) =>
        duplicateOwnerIndexes.includes(index)
          ? { severity: 'error', message: t('You already entered this owner.') }
          : null
      ),
    [ownerFieldAddresses, duplicateOwnerIndexes, t]
  )

  /** The address each field adds as an owner, or null for an empty, invalid or repeated one */
  const ownerAddressesByField = useMemo<(Hex | null)[]>(
    () =>
      ownerFieldAddresses.map((address, index) => {
        if (ownerFieldStates[index]?.isDomainResolving) return null
        if (!isAddress(address) || ownerFieldValidations[index]) return null

        return getAddress(address) as Hex
      }),
    [ownerFieldAddresses, ownerFieldStates, ownerFieldValidations]
  )

  const ownerAddresses = useMemo(
    () => ownerAddressesByField.filter((address): address is Hex => !!address),
    [ownerAddressesByField]
  )

  // Kept within [1, owners count] even when owners are removed after the value was picked
  const requiredConfirmations = Math.max(
    MIN_REQUIRED_CONFIRMATIONS,
    Math.min(selectedRequiredConfirmations, ownerAddresses.length)
  )
  const canDecreaseRequiredConfirmations = requiredConfirmations > MIN_REQUIRED_CONFIRMATIONS
  const canIncreaseRequiredConfirmations = requiredConfirmations < ownerAddresses.length

  const handleDecreaseRequiredConfirmations = useCallback(() => {
    if (!canDecreaseRequiredConfirmations) return

    setSelectedRequiredConfirmations(requiredConfirmations - 1)
  }, [canDecreaseRequiredConfirmations, requiredConfirmations])

  const handleIncreaseRequiredConfirmations = useCallback(() => {
    if (!canIncreaseRequiredConfirmations) return

    setSelectedRequiredConfirmations(requiredConfirmations + 1)
  }, [canIncreaseRequiredConfirmations, requiredConfirmations])

  const addOwnerField = useCallback(() => {
    append(EMPTY_OWNER_FIELD_VALUE)
  }, [append])

  // Empty fields are skipped, so the user can leave a spare field instead of removing it.
  // Anything else must be a valid owner, so no entered owner is silently left out
  const isCreating = isSubmitting || createSafeAccountStatus === 'LOADING'
  const isCreateButtonDisabled =
    !ownerAddresses.length ||
    !areAllOwnerFieldsValid ||
    !!duplicateOwnerIndexes.length ||
    isCreating

  const handleCreate = useCallback(() => {
    if (isCreateButtonDisabled) return

    // Set locally, as the LOADING status of the controller arrives with a delay,
    // in which a second press would dispatch the creation again
    setIsSubmitting(true)
    safeDispatch({
      type: 'method',
      params: { method: 'createSafeAccount', args: [ownerAddresses, requiredConfirmations] }
    })
  }, [isCreateButtonDisabled, ownerAddresses, requiredConfirmations, safeDispatch])

  // Proceed to the account personalization once the Safe is added to the wallet.
  // On error, the controller shows the error and the user stays on the form
  useEffect(() => {
    if (!isSubmitting) return
    if (createSafeAccountStatus !== 'SUCCESS' && createSafeAccountStatus !== 'ERROR') return

    // Syncs with the status of the controller, which is an external store
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsSubmitting(false)
    if (createSafeAccountStatus === 'SUCCESS') goToNextRoute()
  }, [createSafeAccountStatus, goToNextRoute, isSubmitting])

  return {
    control,
    setValue,
    trigger,
    goToPrevRoute,
    ownerFields: fields,
    addOwnerField,
    removeOwnerField: remove,
    ownerFieldValidations,
    ownerAddressesByField,
    ownersCount: ownerAddresses.length,
    requiredConfirmations,
    canDecreaseRequiredConfirmations,
    canIncreaseRequiredConfirmations,
    handleDecreaseRequiredConfirmations,
    handleIncreaseRequiredConfirmations,
    isCreateButtonDisabled,
    handleCreate
  }
}

export default useSafeCreate
