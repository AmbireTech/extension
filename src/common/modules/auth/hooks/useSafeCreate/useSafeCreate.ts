import { getAddress, isAddress } from 'ethers'
import { useCallback, useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import { AddressState } from '@ambire-common/interfaces/domains'
import { Hex } from '@ambire-common/interfaces/hex'
import { getNewSafeAccount, isAllowedSafeOwner } from '@ambire-common/libs/safe/safe'
import { Validation } from '@ambire-common/services/validations'
import { getAddressFromAddressState } from '@ambire-common/utils/domains'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** The values of the Safe create form: one address field per owner */
export type SafeCreateFormValues = {
  owners: AddressState[]
}

const MIN_REQUIRED_CONFIRMATIONS = 1

const getOwnerFieldValue = (fieldValue: string): AddressState => ({
  fieldValue,
  resolvedAddress: '',
  resolvedAddressType: null,
  isDomainResolving: false
})

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

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts

const useSafeCreate = () => {
  const { t } = useTranslation()
  const { goToPrevRoute, goToNextRoute, safeCreateDraft, setSafeCreateDraft } =
    useOnboardingNavigation()
  const { addToast } = useToast()
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { dispatchAndWait: accountPickerDispatchAndWait } = useController('AccountPickerController')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedRequiredConfirmations, setSelectedRequiredConfirmations] = useState(
    () => safeCreateDraft?.requiredConfirmations ?? MIN_REQUIRED_CONFIRMATIONS
  )
  const {
    control,
    setValue,
    trigger,
    formState: { isValid: areAllOwnerFieldsValid }
  } = useForm<SafeCreateFormValues>({
    mode: 'all',
    // No field until the user adds an owner. Coming back from the personalize step, the
    // owners start as the user left them
    defaultValues: {
      owners: safeCreateDraft?.ownerAddresses.map((address) => getOwnerFieldValue(address)) ?? []
    }
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
   * fields. Covers an owner entered in more than one field, and an address Safe refuses.
   */
  const ownerFieldValidations = useMemo<(Validation | null)[]>(
    () =>
      ownerFieldAddresses.map((address, index) => {
        if (duplicateOwnerIndexes.includes(index))
          return { severity: 'error', message: t('You already entered this owner.') }
        // Safe can't be set up with it, so the Safe could never be activated
        if (isAddress(address) && !isAllowedSafeOwner(address))
          return {
            severity: 'error',
            message: t('This address cannot be an owner of a Safe account.')
          }

        return null
      }),
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

  // A new field only once every field has an owner, so there is never more than one to fill
  const canAddOwnerField = ownerAddressesByField.every((address) => !!address)

  const addOwnerField = useCallback(() => {
    if (!canAddOwnerField) return

    append(getOwnerFieldValue(''))
  }, [canAddOwnerField, append])

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

  // An empty field is skipped, so the user can leave the one they added instead of removing
  // it. Anything else must be a valid owner, so no entered owner is silently left out
  const isCreateButtonDisabled =
    !ownerAddresses.length ||
    !areAllOwnerFieldsValid ||
    !!duplicateOwnerIndexes.length ||
    isSubmitting

  // Like a Safe import, the new Safe is only prepared here. The personalize step shows its
  // details, lets the user name it, and adds it to the wallet once they proceed
  const handleCreate = useCallback(async () => {
    if (isCreateButtonDisabled) return

    setIsSubmitting(true)
    try {
      // Throws on an owner setup Safe rejects, which the owner fields already prevent
      const newSafeAccount = getNewSafeAccount(ownerAddresses, requiredConfirmations, accounts)
      // Case-insensitive, in case an account was stored without a checksum (e.g. by an older version)
      const newSafeAddress = newSafeAccount.addr.toLowerCase()
      const isAlreadyInWallet = accounts.some(({ addr }) => addr.toLowerCase() === newSafeAddress)
      // A Safe in the wallet already isn't prepared again - the personalize step only shows it
      if (!isAlreadyInWallet) {
        await accountPickerDispatchAndWait({
          type: 'method',
          params: { method: 'prepareAccounts', args: [{ accounts: [newSafeAccount] }] }
        })
      }
      // Set before moving on, so the personalize step shows the details of this Safe
      setSafeCreateDraft({
        ownerAddresses,
        requiredConfirmations,
        safeAddress: newSafeAccount.addr as Hex,
        isAlreadyInWallet
      })
      goToNextRoute(WEB_ROUTES.accountPersonalize)
    } catch (error) {
      console.error('Failed to prepare the new Safe account', error)
      captureException(error)
      addToast(t("We couldn't create the Safe account. Please try again."), { type: 'error' })
    } finally {
      // Going back from the personalize step adds nothing, so the form is usable again
      setIsSubmitting(false)
    }
  }, [
    isCreateButtonDisabled,
    ownerAddresses,
    requiredConfirmations,
    accounts,
    addToast,
    t,
    accountPickerDispatchAndWait,
    setSafeCreateDraft,
    goToNextRoute
  ])

  return {
    title: t('Your new Safe'),
    handleBackPress: goToPrevRoute,
    control,
    setValue,
    trigger,
    ownerFields: fields,
    addOwnerField,
    canAddOwnerField,
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
