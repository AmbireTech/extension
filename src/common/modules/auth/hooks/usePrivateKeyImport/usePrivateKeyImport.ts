import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'

import { isValidPrivateKey } from '@ambire-common/libs/keyIterator/keyIterator'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useTheme from '@common/hooks/useTheme'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import { storage } from '@common/services/storage'

export default function usePrivateKeyImport() {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm({
    mode: 'all',
    defaultValues: { privateKey: '' }
  })
  const { goToNextRoute } = useOnboardingNavigation()
  const { t } = useTranslation()

  const { dispatchAndWait: mainDispatchAndWait } = useController('MainController')
  const [agreedToBackupWarning, setAgreedToBackupWarning] = useState(false)
  const [importButtonPressed, setImportButtonPressed] = useState(false)

  const handleFormSubmit = useCallback(async () => {
    await storage.set('agreedToBackupWarning', { acceptedAt: Date.now() })

    await handleSubmit(async ({ privateKey }) => {
      setImportButtonPressed(true)
      const trimmedPrivateKey = privateKey.trim()
      const noPrefixPrivateKey =
        trimmedPrivateKey.slice(0, 2) === '0x' ? trimmedPrivateKey.slice(2) : trimmedPrivateKey

      try {
        // Prepares the key's account for the personalize step
        await mainDispatchAndWait({
          type: 'method',
          params: {
            method: 'accountPickerSetInitParamsFromPrivateKeyOrSeedPhrase',
            args: [{ privKeyOrSeed: noPrefixPrivateKey }]
          }
        })
        goToNextRoute(WEB_ROUTES.accountPersonalize)
      } catch (error) {
        // The controller reports its own failures, here the button only becomes usable again
        console.error('Failed to prepare the private key account', error)
      } finally {
        setImportButtonPressed(false)
      }
    })()
  }, [mainDispatchAndWait, handleSubmit, goToNextRoute])

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
    setAgreedToBackupWarning,
    importButtonPressed
  }
}
