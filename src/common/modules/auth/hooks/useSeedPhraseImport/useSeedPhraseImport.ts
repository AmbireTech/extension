import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import { BIP44_STANDARD_DERIVATION_TEMPLATE } from '@ambire-common/consts/derivation'
import useController from '@common/hooks/useController'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'
import { getSeedPhraseStatus, normalizeSeedPhrase } from '@common/modules/auth/utils/seedPhrase'

export default function useSeedPhraseImport() {
  const { goToNextRoute } = useOnboardingNavigation()

  const { initParams, subType } = useController('AccountPickerController').state
  const { dispatch: keystoreDispatch } = useController('KeystoreController')
  const { dispatch: mainDispatch } = useController('MainController')
  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { isValid },
    unregister
  } = useForm({
    mode: 'all',
    defaultValues: { seed: '', passphrase: '' }
  })
  const [importButtonPressed, setImportButtonPressed] = useState(false)

  const [enablePassphrase, setEnablePassphrase] = useState(false)
  const seedValue = useWatch({ control, name: 'seed' })
  const seedPhraseStatus = useMemo(() => getSeedPhraseStatus(seedValue), [seedValue])

  const handleFormSubmit = useCallback(async () => {
    await handleSubmit(({ seed, passphrase }) => {
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
      mainDispatch({
        type: 'method',
        params: {
          method: 'accountPickerSetInitParamsFromPrivateKeyOrSeedPhrase',
          args: [{ privKeyOrSeed: formattedSeed, seedPassphrase: passphrase || null }]
        }
      })
    })()
  }, [mainDispatch, keystoreDispatch, handleSubmit])

  useEffect(() => {
    if (!getValues('seed')) return
    if (!!importButtonPressed && initParams && subType === 'seed') {
      setImportButtonPressed(false)
      goToNextRoute()
    }
  }, [goToNextRoute, getValues, initParams, subType, importButtonPressed])

  useEffect(() => {
    if (!enablePassphrase) {
      setValue('passphrase', '')
      unregister('passphrase')
    }
  }, [enablePassphrase, setValue, unregister])

  const validateSeedPhrase = useCallback(
    (value: string) => getSeedPhraseStatus(value) === 'valid',
    []
  )

  return {
    control,
    isValid,
    enablePassphrase,
    setEnablePassphrase,
    seedPhraseStatus,
    importButtonPressed,
    setImportButtonPressed,
    handleFormSubmit,
    validateSeedPhrase
  }
}
