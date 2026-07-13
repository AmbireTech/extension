import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { isValidPrivateKey } from '@ambire-common/libs/keyIterator/keyIterator'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { storage } from '@common/services/storage'

export default function usePrivateKeyImport() {
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors, isValid }
  } = useForm({
    mode: 'all',
    defaultValues: { privateKey: '' }
  })
  const { goToNextRoute } = useOnboardingNavigation()
  const { t } = useTranslation()

  const { initParams, subType } = useController('AccountPickerController').state
  const { dispatch: mainDispatch } = useController('MainController')
  const [agreedToBackupWarning, setAgreedToBackupWarning] = useState(false)
  const [importButtonPressed, setImportButtonPressed] = useState(false)

  const handleFormSubmit = useCallback(async () => {
    await storage.set('agreedToBackupWarning', { acceptedAt: Date.now() })

    await handleSubmit(({ privateKey }) => {
      setImportButtonPressed(true)
      const trimmedPrivateKey = privateKey.trim()
      const noPrefixPrivateKey =
        trimmedPrivateKey.slice(0, 2) === '0x' ? trimmedPrivateKey.slice(2) : trimmedPrivateKey

      mainDispatch({
        type: 'method',
        params: {
          method: 'accountPickerSetInitParamsFromPrivateKeyOrSeedPhrase',
          args: [{ privKeyOrSeed: noPrefixPrivateKey }]
        }
      })
    })()
  }, [mainDispatch, handleSubmit])

  useEffect(() => {
    if (!getValues('privateKey')) return
    if (!!importButtonPressed && initParams && subType === 'private-key') {
      setImportButtonPressed(false)
      goToNextRoute()
    }
  }, [goToNextRoute, getValues, initParams, importButtonPressed, subType])

  const handleValidation = (value: string) => {
    const trimmedValue = value.trim()

    if (!trimmedValue.length) return t('Field is required.')

    if (!isValidPrivateKey(trimmedValue)) {
      return t('Invalid private key.')
    }

    return undefined
  }

  return {
    control,
    errors,
    isValid,
    handleFormSubmit,
    handleValidation,
    agreedToBackupWarning,
    setAgreedToBackupWarning
  }
}
