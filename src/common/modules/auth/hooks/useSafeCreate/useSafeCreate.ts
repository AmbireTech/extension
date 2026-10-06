import { getAddress, isAddress } from 'ethers'
import { useCallback, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { AddressState, AddressStateOptional } from '@ambire-common/interfaces/domains'
import { Hex } from '@ambire-common/interfaces/hex'
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
const selectContacts = (state: AllControllersMappingType['AddressBookController']) =>
  state.contacts

const useSafeCreate = () => {
  const { t } = useTranslation()
  const { goToPrevRoute } = useOnboardingNavigation()
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: contacts } = useController('AddressBookController', selectContacts)
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

  const enteredOwnerAddress = getAddressFromAddressState(ownerAddressState)
  const isEnteredOwnerAlreadyAdded =
    isAddress(enteredOwnerAddress) && ownerAddressSet.has(enteredOwnerAddress.toLowerCase())

  const duplicateOwnerValidation = useMemo<Validation | null>(
    () =>
      isEnteredOwnerAlreadyAdded
        ? { severity: 'error', message: t('This owner is already added.') }
        : null,
    [isEnteredOwnerAlreadyAdded, t]
  )

  const {
    address: ownerAddress,
    validation: ownerAddressValidation,
    RHFValidate: validateOwnerAddress,
    resetAddressInput
  } = useAddressInput({
    addressState: ownerAddressState,
    setAddressState: setOwnerAddressState,
    overwriteValidation: duplicateOwnerValidation,
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

  const isAddOwnerButtonDisabled = !isValid || !isAddress(ownerAddress)

  const handleAddOwner = useCallback(() => {
    if (isAddOwnerButtonDisabled) return

    const checksummedOwnerAddress = getAddress(ownerAddress) as Hex
    setOwnerAddresses((currentOwnerAddresses) =>
      currentOwnerAddresses.some(
        (address) => address.toLowerCase() === checksummedOwnerAddress.toLowerCase()
      )
        ? currentOwnerAddresses
        : [...currentOwnerAddresses, checksummedOwnerAddress]
    )
    resetAddressInput()
  }, [isAddOwnerButtonDisabled, ownerAddress, resetAddressInput])

  const handleRemoveOwner = useCallback((addressToRemove: Hex) => {
    setOwnerAddresses((currentOwnerAddresses) =>
      currentOwnerAddresses.filter(
        (address) => address.toLowerCase() !== addressToRemove.toLowerCase()
      )
    )
  }, [])

  const isCreateButtonDisabled = !owners.length

  const handleCreate = useCallback(() => {
    if (isCreateButtonDisabled) return

    // TODO: deploy the Safe with `owners` and `requiredConfirmations` once the
    // creation logic is available in ambire-common
  }, [isCreateButtonDisabled])

  return {
    control,
    goToPrevRoute,
    ownerAddressState,
    ownerAddressValidation,
    validateOwnerAddress,
    owners,
    isAddOwnerButtonDisabled,
    handleAddOwner,
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
