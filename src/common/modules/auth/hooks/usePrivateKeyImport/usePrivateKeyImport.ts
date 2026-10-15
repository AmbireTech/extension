import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import {
  isValidPrivateKey,
  MAX_BULK_PRIVATE_KEYS
} from '@ambire-common/libs/keyIterator/keyIterator'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { getDuplicatePrivateKeyIndexes } from '@common/modules/auth/utils/privateKeys'
import { storage } from '@common/services/storage'

/** The value of a new, empty private key field */
export const DEFAULT_PRIVATE_KEY_FIELD_VALUE = { value: '' }

const DEFAULT_FORM_VALUES = { privateKeys: [DEFAULT_PRIVATE_KEY_FIELD_VALUE] }

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

  const { initParams, subType } = useController('AccountPickerController').state
  const { dispatch: mainDispatch } = useController('MainController')
  const [agreedToBackupWarning, setAgreedToBackupWarning] = useState(false)
  const [importButtonPressed, setImportButtonPressed] = useState(false)

  const duplicatePrivateKeyIndexes = useMemo(
    () => getDuplicatePrivateKeyIndexes(privateKeys),
    [privateKeys]
  )

  const isValid = areAllFieldsValid && !duplicatePrivateKeyIndexes.length
  const canAddMore = fields.length < MAX_BULK_PRIVATE_KEYS

  const handleFormSubmit = useCallback(async () => {
    await storage.set('agreedToBackupWarning', { acceptedAt: Date.now() })

    await handleSubmit((formValues) => {
      // The submit button is disabled for duplicates, but submitting with the keyboard isn't
      if (getDuplicatePrivateKeyIndexes(formValues.privateKeys).length) return

      setImportButtonPressed(true)
      mainDispatch({
        type: 'method',
        params: {
          method: 'accountPickerSetInitParamsFromPrivateKeys',
          args: [{ privateKeys: formValues.privateKeys.map(({ value }) => value) }]
        }
      })
    })()
  }, [mainDispatch, handleSubmit])

  useEffect(() => {
    if (!!importButtonPressed && initParams && subType === 'private-key') {
      setImportButtonPressed(false)
      // The keys are already in the background, so they shouldn't stay in the form's memory
      reset(DEFAULT_FORM_VALUES)
      goToNextRoute()
    }
  }, [goToNextRoute, initParams, importButtonPressed, subType, reset])

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
    handleFormSubmit,
    handleValidation,
    getPrivateKeyError,
    agreedToBackupWarning,
    setAgreedToBackupWarning
  }
}
