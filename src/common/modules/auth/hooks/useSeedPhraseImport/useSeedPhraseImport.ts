import { wordlists } from 'bip39'
import { Mnemonic } from 'ethers'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { BIP44_STANDARD_DERIVATION_TEMPLATE } from '@ambire-common/consts/derivation'
import { useTranslation } from '@common/config/localization'
import useController from '@common/hooks/useController'
import useOnboardingNavigation from '@common/modules/auth/hooks/useOnboardingNavigation'

export default function useSeedPhraseImport() {
  const { goToNextRoute } = useOnboardingNavigation()
  const { t } = useTranslation()

  const { initParams, subType } = useController('AccountPickerController').state
  const { dispatch: keystoreDispatch } = useController('KeystoreController')
  const { dispatch: mainDispatch } = useController('MainController')
  const {
    watch,
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
  const [seedPhraseStatus, setSeedPhraseStatus] = useState<'incomplete' | 'valid' | 'invalid'>(
    'incomplete'
  )

  useEffect(() => {
    const { unsubscribe } = watch((value) => {
      if (!value.seed) {
        setSeedPhraseStatus('incomplete')
        return
      }

      const formattedSeed = value.seed.trim().split(/\s+/).join(' ')

      if (!Mnemonic.isValidMnemonic(formattedSeed)) {
        setSeedPhraseStatus('invalid')
        return
      }

      setSeedPhraseStatus('valid')
    })
    return () => unsubscribe()
  }, [watch])

  const handleFormSubmit = useCallback(async () => {
    await handleSubmit(({ seed, passphrase }) => {
      const formattedSeed = seed.trim().toLowerCase().replace(/\s+/g, ' ')
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

  const validateSeedPhraseWord = useCallback(
    (value: string) => {
      const formattedSeed = value.trim().toLowerCase().replace(/\s+/g, ' ')

      const couldValueBeAPastedSeed = formattedSeed.length > 1

      // If the value contains multiple words, it could be a pasted seed phrase
      // Don't display errors in this case, otherwise an error flashes when pasting
      if (!formattedSeed || couldValueBeAPastedSeed) return undefined
      if (!wordlists.english?.includes(value)) return t('invalid-bip39-word')
      return undefined
    },
    [t]
  )

  return {
    control,
    isValid,
    enablePassphrase,
    setEnablePassphrase,
    seedPhraseStatus,
    setSeedPhraseStatus,
    importButtonPressed,
    setImportButtonPressed,
    handleFormSubmit,
    validateSeedPhraseWord
  }
}
