import { getAddress, isAddress } from 'ethers'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { AddressState, AddressStateOptional } from '@ambire-common/interfaces/domains'
import { Hex } from '@ambire-common/interfaces/hex'
import { isSmartAccount } from '@ambire-common/libs/account/account'
import { Validation } from '@ambire-common/services/validations'
import { getAddressFromAddressState } from '@ambire-common/utils/domains'
import { useTranslation } from '@common/config/localization'
import useAddressInput from '@common/hooks/useAddressInput'
import useController from '@common/hooks/useController'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** An owner the user has added to the Safe that is about to be created. */
export type SafeCreateOwner = {
  address: Hex
  /** The label of the matching wallet account or address book contact, if any */
  name?: string
}

type FormValues = {
  ownerAddress: AddressState
}

const MIN_REQUIRED_CONFIRMATIONS = 1

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectContacts = (state: AllControllersMappingType['AddressBookController']) => state.contacts
const selectCreateSafeAccountStatus = (state: AllControllersMappingType['SafeController']) =>
  state.statuses.createSafeAccount

const useSafeCreate = () => {
  const { t } = useTranslation()
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: contacts } = useController('AddressBookController', selectContacts)
  const { state: createSafeAccountStatus, dispatch: safeDispatch } = useController(
    'SafeController',
    selectCreateSafeAccountStatus
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [ownerAddresses, setOwnerAddresses] = useState<Hex[]>([])
  const [selectedRequiredConfirmations, setSelectedRequiredConfirmations] = useState(
    MIN_REQUIRED_CONFIRMATIONS
  )
  const {
    control,
    setValue,
    trigger,
    formState: { isValid }
  } = useForm<FormValues>({
    mode: 'all',
    defaultValues: {
      ownerAddress: {
        fieldValue: '',
        resolvedAddress: '',
        resolvedAddressType: null,
        isDomainResolving: false
      }
    }
  })
  const ownerAddressState = useWatch({ control, name: 'ownerAddress' })

  const setOwnerAddressState = useCallback(
    (newState: AddressStateOptional) => {
      const addressStateEntries = Object.entries(newState) as [
        keyof AddressState,
        AddressState[keyof AddressState]
      ][]

      addressStateEntries.forEach(([key, value]) => {
        setValue(`ownerAddress.${key}`, value, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true
        })
      })
    },
    [setValue]
  )
  const handleRevalidateOwnerAddress = useCallback(() => {
    void trigger('ownerAddress.fieldValue')
  }, [trigger])

  const ownerAddressSet = useMemo(
    () => new Set(ownerAddresses.map((address) => address.toLowerCase())),
    [ownerAddresses]
  )

  const enteredOwnerAddress = useMemo(
    () => getAddressFromAddressState(ownerAddressState),
    [ownerAddressState]
  )
  const isEnteredOwnerAlreadyAdded =
    isAddress(enteredOwnerAddress) && ownerAddressSet.has(enteredOwnerAddress.toLowerCase())

  // Only the owners that sign with a key are supported for now, so the smart accounts
  // (incl. Safes) in the wallet are disabled in the list and can't be added
  const getUnsupportedOwnerReason = useCallback(
    (address: string) => {
      const smartAccount = accounts.find(
        (account) => isSmartAccount(account) && account.addr.toLowerCase() === address.toLowerCase()
      )
      if (!smartAccount) return null

      return t('Smart accounts coming soon.')
    },
    [accounts, t]
  )

  // Covers a smart account address that is typed or pasted instead of picked from the list
  const ownerValidation = useMemo<Validation | null>(() => {
    const unsupportedOwnerReason = getUnsupportedOwnerReason(enteredOwnerAddress)
    if (unsupportedOwnerReason) return { severity: 'error', message: unsupportedOwnerReason }
    if (isEnteredOwnerAlreadyAdded)
      return { severity: 'error', message: t('This owner is already added.') }

    return null
  }, [enteredOwnerAddress, getUnsupportedOwnerReason, isEnteredOwnerAlreadyAdded, t])

  const {
    address: ownerAddress,
    validation: ownerAddressValidation,
    RHFValidate: validateOwnerAddress,
    resetAddressInput
  } = useAddressInput({
    addressState: ownerAddressState,
    setAddressState: setOwnerAddressState,
    overwriteValidation: ownerValidation,
    handleRevalidate: handleRevalidateOwnerAddress
  })

  const owners = useMemo<SafeCreateOwner[]>(() => {
    const accountLabelByAddress = new Map(
      accounts.map((account) => [account.addr.toLowerCase(), account.preferences.label])
    )
    const contactNameByAddress = new Map(
      contacts.map((contact) => [contact.address.toLowerCase(), contact.name])
    )

    return ownerAddresses.map((address) => {
      const normalizedAddress = address.toLowerCase()

      return {
        address,
        name:
          accountLabelByAddress.get(normalizedAddress) ||
          contactNameByAddress.get(normalizedAddress)
      }
    })
  }, [accounts, contacts, ownerAddresses])

  // Kept within [1, owners count] even when owners are removed after the value was picked
  const requiredConfirmations = Math.max(
    MIN_REQUIRED_CONFIRMATIONS,
    Math.min(selectedRequiredConfirmations, owners.length)
  )
  const canDecreaseRequiredConfirmations = requiredConfirmations > MIN_REQUIRED_CONFIRMATIONS
  const canIncreaseRequiredConfirmations = requiredConfirmations < owners.length

  const handleDecreaseRequiredConfirmations = useCallback(() => {
    if (!canDecreaseRequiredConfirmations) return

    setSelectedRequiredConfirmations(requiredConfirmations - 1)
  }, [canDecreaseRequiredConfirmations, requiredConfirmations])

  const handleIncreaseRequiredConfirmations = useCallback(() => {
    if (!canIncreaseRequiredConfirmations) return

    setSelectedRequiredConfirmations(requiredConfirmations + 1)
  }, [canIncreaseRequiredConfirmations, requiredConfirmations])

  const canAddEnteredOwner = isValid && isAddress(ownerAddress) && !ownerValidation

  // An eligible owner is added as soon as it's picked from the list, pasted or its domain
  // is resolved, and the field is cleared for the next one. It can be removed from the list
  useEffect(() => {
    if (!canAddEnteredOwner) return

    const checksummedOwnerAddress = getAddress(ownerAddress) as Hex
    // Syncs with the address input, whose validation and domain resolution are async
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOwnerAddresses((currentOwnerAddresses) =>
      currentOwnerAddresses.some(
        (address) => address.toLowerCase() === checksummedOwnerAddress.toLowerCase()
      )
        ? currentOwnerAddresses
        : [...currentOwnerAddresses, checksummedOwnerAddress]
    )
    resetAddressInput()
  }, [canAddEnteredOwner, ownerAddress, resetAddressInput])

  const handleRemoveOwner = useCallback((addressToRemove: Hex) => {
    setOwnerAddresses((currentOwnerAddresses) =>
      currentOwnerAddresses.filter(
        (address) => address.toLowerCase() !== addressToRemove.toLowerCase()
      )
    )
  }, [])

  // Eligible owners are added right away, so anything left in the field is still being
  // entered or can't be added (its validation says why) and doesn't block the creation
  const isCreating = isSubmitting || createSafeAccountStatus === 'LOADING'
  const isCreateButtonDisabled = !owners.length || isCreating

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
    goToPrevRoute,
    ownerAddressState,
    ownerAddressValidation,
    validateOwnerAddress,
    owners,
    getUnsupportedOwnerReason,
    handleRemoveOwner,
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
