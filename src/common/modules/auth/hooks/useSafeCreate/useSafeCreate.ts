import { getAddress, isAddress } from 'ethers'
import { useCallback, useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import { AddressState } from '@ambire-common/interfaces/domains'
import { Hex } from '@ambire-common/interfaces/hex'
import { getNewSafeAccount } from '@ambire-common/libs/safe/safe'
import { Validation } from '@ambire-common/services/validations'
import { getIsViewOnly } from '@ambire-common/utils/accounts'
import { getAddressFromAddressState } from '@ambire-common/utils/domains'
import { captureException } from '@common/config/analytics/CrashAnalytics'
import { useTranslation } from '@common/config/localization'
import { useScreenBackHandler } from '@common/contexts/screenBackContext'
import useController from '@common/hooks/useController'
import useToast from '@common/hooks/useToast'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** The values of the Safe create form: one address field per owner */
export type SafeCreateFormValues = {
  owners: AddressState[]
}

/** An owner of the Safe about to be created, as shown on the preview step */
export type SafeCreatePreviewOwner = {
  address: Hex
  /** The label of the matching wallet account or address book contact, if any */
  name?: string
  /**
   * Whether the user can sign as this owner: for an account in the wallet, one of its keys is
   * in the keystore (for a smart account, those are not its address), else its address is
   */
  canSign: boolean
  /** Whether the owner is an account in the wallet, even a view-only one */
  isInWallet: boolean
}

/** What the preview step shows about the Safe about to be created */
export type SafeCreatePreview = {
  address: Hex
  version: string
  requiredConfirmations: number
  owners: SafeCreatePreviewOwner[]
}

/** The Safe version `getNewSafeAccount` creates (see `SAFE_V1_4_1`) */
const NEW_SAFE_VERSION = '1.4.1'

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
const selectContacts = (state: AllControllersMappingType['AddressBookController']) => state.contacts
const selectKeystoreKeys = (state: AllControllersMappingType['KeystoreController']) => state.keys

const useSafeCreate = () => {
  const { t } = useTranslation()
  const { goToPrevRoute, goToNextRoute } = useOnboardingNavigation()
  const { addToast } = useToast()
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: contacts } = useController('AddressBookController', selectContacts)
  const { state: keystoreKeys } = useController('KeystoreController', selectKeystoreKeys)
  const { dispatchAndWait: accountPickerDispatchAndWait } = useController('AccountPickerController')
  const [isSubmitting, setIsSubmitting] = useState(false)
  // The preview is a step of this screen, so going back to the form keeps what was entered
  const [isPreviewing, setIsPreviewing] = useState(false)
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
  const isContinueButtonDisabled =
    !ownerAddresses.length || !areAllOwnerFieldsValid || !!duplicateOwnerIndexes.length

  // Built only for the preview, as the address can't change while it's shown
  const newSafeAccount = useMemo(
    () =>
      isPreviewing && ownerAddresses.length
        ? getNewSafeAccount(ownerAddresses, requiredConfirmations, accounts)
        : null,
    [isPreviewing, ownerAddresses, requiredConfirmations, accounts]
  )

  const preview = useMemo<SafeCreatePreview | null>(() => {
    if (!newSafeAccount) return null

    const accountByAddress = new Map(
      accounts.map((account) => [account.addr.toLowerCase(), account])
    )
    const contactNameByAddress = new Map(
      contacts.map((contact) => [contact.address.toLowerCase(), contact.name])
    )
    const keyAddresses = new Set(keystoreKeys.map((key) => key.addr.toLowerCase()))

    return {
      address: newSafeAccount.addr as Hex,
      version: NEW_SAFE_VERSION,
      requiredConfirmations,
      owners: ownerAddresses.map((address) => {
        const normalizedAddress = address.toLowerCase()
        const account = accountByAddress.get(normalizedAddress)

        return {
          address,
          name: account?.preferences.label || contactNameByAddress.get(normalizedAddress),
          // An account in the wallet signs with its own keys, which for a smart account
          // (incl. a Safe) are not its address. Any other owner signs only as a key itself
          canSign: account
            ? !getIsViewOnly(keystoreKeys, account.associatedKeys)
            : keyAddresses.has(normalizedAddress),
          isInWallet: !!account
        }
      })
    }
  }, [newSafeAccount, accounts, contacts, keystoreKeys, requiredConfirmations, ownerAddresses])

  const handleContinue = useCallback(() => {
    if (isContinueButtonDisabled) return

    // Checked before the preview, so the user fixes the setup while still on the form
    const { addr: newSafeAddress } = getNewSafeAccount(
      ownerAddresses,
      requiredConfirmations,
      accounts
    )
    if (accounts.some(({ addr }) => addr === newSafeAddress)) {
      addToast(
        t(
          'This Safe account is already in your wallet. The same owners and required confirmations always lead to the same account.'
        ),
        { type: 'error' }
      )
      return
    }

    setIsPreviewing(true)
  }, [isContinueButtonDisabled, ownerAddresses, requiredConfirmations, accounts, addToast, t])

  const handleBackToForm = useCallback(() => setIsPreviewing(false), [])

  // The swipe and Android's back return to the form from the preview, like the back arrow
  useScreenBackHandler(isPreviewing ? handleBackToForm : null)

  const handleBackPress = isPreviewing ? handleBackToForm : goToPrevRoute
  const title = isPreviewing ? t('Review Safe account') : t('Create Safe account')

  const isCreateButtonDisabled = !newSafeAccount || isSubmitting

  // Like a Safe import, the new Safe is only prepared here. The personalize step, where the
  // user can name it, adds it to the wallet once they proceed
  const handleCreate = useCallback(async () => {
    if (isCreateButtonDisabled || !newSafeAccount) return

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
    newSafeAccount,
    addToast,
    t,
    accountPickerDispatchAndWait,
    goToNextRoute
  ])

  return {
    control,
    setValue,
    trigger,
    title,
    handleBackPress,
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
    isContinueButtonDisabled,
    handleContinue,
    preview,
    isCreateButtonDisabled,
    handleCreate
  }
}

export default useSafeCreate
