import { useCallback, useMemo, useState } from 'react'
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
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import { storage } from '@common/services/storage'

import type { AllControllersMappingType } from '@common/constants/controllersMapping'

const DEFAULT_FORM_VALUES = { privateKeys: [{ value: '' }] }

const selectAccounts = (state: AllControllersMappingType['AccountsController']) => state.accounts
const selectKeystoreKeys = (state: AllControllersMappingType['KeystoreController']) => state.keys

export default function usePrivateKeyImport() {
  const {
    control,
    handleSubmit,
    reset,
    formState: { isValid: areAllFieldsValid }
  } = useForm({
    mode: 'all',
    defaultValues: DEFAULT_FORM_VALUES
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'privateKeys' })
  const privateKeys = useWatch({ control, name: 'privateKeys' })
  const { goToNextRoute } = useOnboardingNavigation()
  const { t } = useTranslation()

  const { dispatchAndWait: mainDispatchAndWait } = useController('MainController')
  const { state: accounts } = useController('AccountsController', selectAccounts)
  const { state: keystoreKeys } = useController('KeystoreController', selectKeystoreKeys)
  const [agreedToBackupWarning, setAgreedToBackupWarning] = useState(false)
  const [importButtonPressed, setImportButtonPressed] = useState(false)

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

  // Empty fields are skipped, so the user can leave a spare field instead of removing it
  const filledPrivateKeysCount = privateKeys.filter(({ value }) => value.trim()).length

  // There is nothing to import when every entered key is already in the wallet
  const areAllPrivateKeysAlreadyImported =
    alreadyImportedPrivateKeyIndexes.length === filledPrivateKeysCount

  const isValid =
    filledPrivateKeysCount > 0 &&
    areAllFieldsValid &&
    !duplicatePrivateKeyIndexes.length &&
    !areAllPrivateKeysAlreadyImported
  const canAddMore = fields.length < MAX_BULK_PRIVATE_KEYS

  const handleFormSubmit = useCallback(async () => {
    // The submit button is disabled in these cases, but submitting with the keyboard isn't
    if (!isValid || !agreedToBackupWarning || importButtonPressed) return

    await storage.set('agreedToBackupWarning', { acceptedAt: Date.now() })

    await handleSubmit(async (formValues) => {
      setImportButtonPressed(true)
      try {
        // Sets the picker up with the keys - personalize prepares their accounts
        await mainDispatchAndWait({
          type: 'method',
          params: {
            method: 'accountPickerSetInitParamsFromPrivateKeys',
            args: [
              {
                privateKeys: formValues.privateKeys
                  .map(({ value }) => value)
                  .filter((value) => value.trim())
              }
            ]
          }
        })
        // The keys are already in the background, so they shouldn't stay in the form's memory
        reset(DEFAULT_FORM_VALUES)
        goToNextRoute(WEB_ROUTES.accountPersonalize)
      } catch (error) {
        // The background shows the error, and the entered keys stay so the user can fix them
        console.error('Failed to set the account picker up with the private keys', error)
      } finally {
        setImportButtonPressed(false)
      }
    })()
  }, [
    isValid,
    agreedToBackupWarning,
    importButtonPressed,
    mainDispatchAndWait,
    handleSubmit,
    reset,
    goToNextRoute
  ])

  const handleValidation = useCallback(
    (value: string) => {
      const trimmedValue = value.trim()

      // An empty field is skipped on submit, so it is not an error
      if (!trimmedValue.length) return undefined

      if (!isValidPrivateKey(trimmedValue)) {
        return t('Invalid private key.')
      }

      return undefined
    },
    [t]
  )

  /**
   * What to show under each field, worked out once here so every field gets plain values.
   * An empty field shows nothing (it is skipped); an invalid or repeated key shows an error; a key whose
   * account is already in the wallet shows a note.
   */
  const privateKeyFieldStates = useMemo(
    () =>
      privateKeys.map(({ value }, index) => {
        if (!value.trim()) return { isValid: false }

        const error =
          handleValidation(value) ||
          (duplicatePrivateKeyIndexes.includes(index)
            ? t('You already entered this private key.')
            : undefined)
        const info =
          !error && alreadyImportedPrivateKeyIndexes.includes(index)
            ? t('This account is already in your wallet.')
            : undefined

        return { error, info, isValid: !error && !info }
      }),
    [privateKeys, handleValidation, duplicatePrivateKeyIndexes, alreadyImportedPrivateKeyIndexes, t]
  )

  const addPrivateKeyField = useCallback(() => {
    if (!canAddMore) return

    append({ value: '' })
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
    privateKeyFieldStates,
    agreedToBackupWarning,
    setAgreedToBackupWarning
  }
}
