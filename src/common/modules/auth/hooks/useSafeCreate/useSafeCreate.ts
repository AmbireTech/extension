import { getAddress, isAddress } from 'ethers'
import { useCallback, useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import { AddressState } from '@ambire-common/interfaces/domains'
import { Hex } from '@ambire-common/interfaces/hex'
import { getNewSafeAccount } from '@ambire-common/libs/safe/safe'
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

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts

const useSafeCreate = () => {
  const { t } = useTranslation()
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { addToast } = useToast()
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { dispatchAndWait: accountPickerDispatchAndWait } = useController('AccountPickerController')
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
  const isCreateButtonDisabled =
    !ownerAddresses.length ||
    !areAllOwnerFieldsValid ||
    !!duplicateOwnerIndexes.length ||
    isSubmitting

  // Like a Safe import, the new Safe is only prepared here. The personalize step, where the
  // user can name it, adds it to the wallet once they proceed
  const handleCreate = useCallback(async () => {
    if (isCreateButtonDisabled) return

    const newSafeAccount = getNewSafeAccount(ownerAddresses, requiredConfirmations, accounts)
    if (accounts.some(({ addr }) => addr === newSafeAccount.addr)) {
      addToast(
        t(
          'This Safe account is already in your wallet. The same owners and required confirmations always lead to the same account.'
        ),
        { type: 'error' }
      )
      return
    }

    setIsSubmitting(true)
    try {
      await accountPickerDispatchAndWait({
        type: 'method',
        params: { method: 'prepareAccounts', args: [{ accounts: [newSafeAccount] }] }
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
    goToNextRoute
  ])

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
