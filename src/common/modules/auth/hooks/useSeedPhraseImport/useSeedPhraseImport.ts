import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { BIP44_STANDARD_DERIVATION_TEMPLATE } from '@ambire-common/consts/derivation'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import {
  getSeedPhraseValidation,
  normalizeSeedPhrase,
  SeedPhraseError
} from '@common/modules/auth/utils/seedPhrase'

export default function useSeedPhraseImport() {
  const { goToNextRoute } = useOnboardingNavigation()
  const { t } = useTranslation()

  const { dispatch: keystoreDispatch } = useController('KeystoreController')
  const { dispatchAndWait: mainDispatchAndWait } = useController('MainController')
  const {
    control,
    handleSubmit,
    setValue,
    formState: { isValid },
    unregister
  } = useForm({
    mode: 'all',
    defaultValues: { seed: '', passphrase: '' }
  })
  const [importButtonPressed, setImportButtonPressed] = useState(false)

  const [enablePassphrase, setEnablePassphrase] = useState(false)
  const seedValue = useWatch({ control, name: 'seed' })
  // `null` while the seed input is not focused
  const [seedCaretPosition, setSeedCaretPosition] = useState<number | null>(null)
  const { status: seedPhraseStatus, error } = useMemo(
    () => getSeedPhraseValidation(seedValue, seedCaretPosition),
    [seedValue, seedCaretPosition]
  )

  const seedPhraseError = useMemo(() => {
    if (!error) return undefined

    const errorMessages: { [key in SeedPhraseError]: string } = {
      'unknown-words': t('Some words are not valid recovery phrase words.'),
      'wrong-word-count': t('A recovery phrase has 12, 15, 18, 21 or 24 words.'),
      'invalid-phrase': t(
        'Invalid recovery phrase. Check that the words are spelled correctly and in the right order.'
      )
    }

    return errorMessages[error]
  }, [error, t])

  const handleFormSubmit = useCallback(async () => {
    await handleSubmit(async ({ seed, passphrase }) => {
      const formattedSeed = normalizeSeedPhrase(seed)
      setImportButtonPressed(true)
      keystoreDispatch({
        type: 'method',
        params: {
          method: 'addTempSeed',
          args: [
            {
              seed: formattedSeed,
              seedPassphrase: passphrase || null,
              hdPathTemplate: BIP44_STANDARD_DERIVATION_TEMPLATE
            }
          ]
        }
      })
      try {
        // Selects and prepares the phrase's first account for the personalize step
        await mainDispatchAndWait({
          type: 'method',
          params: {
            method: 'accountPickerSetInitParamsFromPrivateKeyOrSeedPhrase',
            args: [{ privKeyOrSeed: formattedSeed, seedPassphrase: passphrase || null }]
          }
        })
        goToNextRoute()
      } catch (error) {
        // The controller reports its own failures, here the button only becomes usable again
        console.error('Failed to prepare the recovery phrase accounts', error)
      } finally {
        setImportButtonPressed(false)
      }
    })()
  }, [mainDispatchAndWait, keystoreDispatch, handleSubmit, goToNextRoute])

  useEffect(() => {
    if (!enablePassphrase) {
      setValue('passphrase', '')
      unregister('passphrase')
    }
  }, [enablePassphrase, setValue, unregister])

  const validateSeedPhrase = useCallback(
    (value: string) => getSeedPhraseValidation(value).status === 'valid',
    []
  )

  return {
    control,
    isValid,
    enablePassphrase,
    setEnablePassphrase,
    seedPhraseStatus,
    seedPhraseError,
    seedCaretPosition,
    setSeedCaretPosition,
    importButtonPressed,
    handleFormSubmit,
    validateSeedPhrase
  }
}
