import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import {
  isValidPrivateKey,
  MAX_BULK_PRIVATE_KEYS
} from '@ambire-common/libs/keyIterator/keyIterator'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import {
  getAddressFromPrivateKey,
  getDuplicatePrivateKeyIndexes
} from '@common/modules/auth/utils/privateKeys'
import { storage } from '@common/services/storage'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

/** The value of a new, empty private key field */
export const DEFAULT_PRIVATE_KEY_FIELD_VALUE = { value: '' }

const DEFAULT_FORM_VALUES = { privateKeys: [DEFAULT_PRIVATE_KEY_FIELD_VALUE] }

const selectMainStatuses = (state: AllControllersMappingType['MainController']) => state.statuses
const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectKeystoreKeys = (state: AllControllersMappingType['KeystoreController']) => state.keys

export default function usePrivateKeyImport() {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isValid: areAllFieldsValid }
  } = useForm({
    mode: 'all',
    defaultValues: DEFAULT_FORM_VALUES
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'privateKeys' })
  const privateKeys = useWatch({ control, name: 'privateKeys' })
  const { goToNextRoute } = useOnboardingNavigation()
  const { t } = useTranslation()

  const { state: mainStatuses, dispatch: mainDispatch } = useController(
    'MainController',
    selectMainStatuses
  )
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: keystoreKeys } = useController('KeystoreController', selectKeystoreKeys)
  const [agreedToBackupWarning, setAgreedToBackupWarning] = useState(false)
  const [importButtonPressed, setImportButtonPressed] = useState(false)
  // The account picker may already hold init params from an abandoned attempt, so waiting
  // for them to appear is not enough. The status tells us the background is done.
  const hasSeenLoading = useRef(false)

  const duplicatePrivateKeyIndexes = useMemo(
    () => getDuplicatePrivateKeyIndexes(privateKeys),
    [privateKeys]
  )

  // A key counts as already imported only if both its account and the key itself are in the
  // wallet. A view-only account whose key is entered now gets upgraded, so it isn't flagged.
  const alreadyImportedPrivateKeyIndexes = useMemo(() => {
    const addressesWithImportedKey = new Set(
      keystoreKeys
        .filter((key) => key.type === 'internal')
        .map((key) => key.addr.toLowerCase())
        .filter((addr) => accounts.some((account) => account.addr.toLowerCase() === addr))
    )

    return privateKeys.reduce<number[]>((indexes, { value }, index) => {
      const address = getAddressFromPrivateKey(value)?.toLowerCase()

      return address && addressesWithImportedKey.has(address) ? [...indexes, index] : indexes
    }, [])
  }, [privateKeys, keystoreKeys, accounts])

  // There is nothing to import when every entered key is already in the wallet
  const areAllPrivateKeysAlreadyImported =
    alreadyImportedPrivateKeyIndexes.length === privateKeys.length

  const isValid =
    areAllFieldsValid && !duplicatePrivateKeyIndexes.length && !areAllPrivateKeysAlreadyImported
  const canAddMore = fields.length < MAX_BULK_PRIVATE_KEYS

  const handleFormSubmit = useCallback(async () => {
    // The submit button is disabled in these cases, but submitting with the keyboard isn't
    if (!isValid || !agreedToBackupWarning || importButtonPressed) return

    await storage.set('agreedToBackupWarning', { acceptedAt: Date.now() })

    await handleSubmit((formValues) => {
      hasSeenLoading.current = false
      setImportButtonPressed(true)
      mainDispatch({
        type: 'method',
        params: {
          method: 'accountPickerSetInitParamsFromPrivateKeys',
          args: [{ privateKeys: formValues.privateKeys.map(({ value }) => value) }]
        }
      })
    })()
  }, [isValid, agreedToBackupWarning, importButtonPressed, mainDispatch, handleSubmit])

  useEffect(() => {
    if (!importButtonPressed) return

    const status = mainStatuses.accountPickerSetInitParamsFromPrivateKeys
    if (status === 'LOADING') {
      hasSeenLoading.current = true
      return
    }

    if (!hasSeenLoading.current) return

    setImportButtonPressed(false)

    // The background shows the error, and the entered keys stay so the user can fix them
    if (status === 'ERROR') return

    // The keys are already in the background, so they shouldn't stay in the form's memory
    reset(DEFAULT_FORM_VALUES)
    goToNextRoute()
  }, [
    goToNextRoute,
    importButtonPressed,
    mainStatuses.accountPickerSetInitParamsFromPrivateKeys,
    reset
  ])

  const handleValidation = useCallback(
    (value: string) => {
      const trimmedValue = value.trim()

      if (!trimmedValue.length) return t('Field is required.')

      if (!isValidPrivateKey(trimmedValue)) {
        return t('Invalid private key.')
      }

      return undefined
    },
    [t]
  )

  /** The error to show under a field: an invalid key first, then a key entered twice */
  const getPrivateKeyError = useCallback(
    (index: number) => {
      const fieldError = errors.privateKeys?.[index]?.value?.message
      if (fieldError) return fieldError

      if (duplicatePrivateKeyIndexes.includes(index)) {
        return t('You already entered this private key.')
      }

      return undefined
    },
    [errors.privateKeys, duplicatePrivateKeyIndexes, t]
  )

  /** A note to show under a field whose account is already in the wallet with this key */
  const getPrivateKeyInfo = useCallback(
    (index: number) => {
      if (!alreadyImportedPrivateKeyIndexes.includes(index)) return undefined

      return t('This account is already in your wallet.')
    },
    [alreadyImportedPrivateKeyIndexes, t]
  )

  const addPrivateKeyField = useCallback(() => {
    if (!canAddMore) return

    append({ ...DEFAULT_PRIVATE_KEY_FIELD_VALUE })
  }, [append, canAddMore])

  return {
    control,
    fields,
    addPrivateKeyField,
    removePrivateKeyField: remove,
    canAddMore,
    isValid,
    isImporting: importButtonPressed,
    handleFormSubmit,
    handleValidation,
    getPrivateKeyError,
    getPrivateKeyInfo,
    agreedToBackupWarning,
    setAgreedToBackupWarning
  }
}
