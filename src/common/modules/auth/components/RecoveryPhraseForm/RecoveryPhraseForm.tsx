import { Wallet } from 'ethers'
import React, { useCallback, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Keyboard } from 'react-native'

import Button from '@common/components/Button'
import Input from '@common/components/Input'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useToast from '@common/hooks/useToast'
import useExternalSignerLogin from '@common/modules/auth/hooks/useExternalSignerLogin'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { delayPromise } from '@common/utils/promises'

const formatMnemonic = (mnemonic: string) =>
  mnemonic
    .replace(/;/g, ' ')
    .replace(/,/g, ' ')
    .replace(/\s{2,}/g, ' ')

const RecoveryPhraseForm: React.FC<any> = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { addExternalSigner } = useExternalSignerLogin()
  const [memWallet, setMemWallet] = useState<any>(null)
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    reValidateMode: 'onChange',
    defaultValues: {
      signer: ''
    }
  })

  const handleFormSubmit = useCallback(() => {
    !isWeb && Keyboard.dismiss()

    handleSubmit(async ({ signer }) => {
      // wait state update before Wallet calcs because
      // when Wallet method is called on devices with slow CPU the UI freezes
      await delayPromise(100)

      try {
        const mnemonic = formatMnemonic(signer)
        let wallet

        if (memWallet) {
          wallet = memWallet
        } else {
          wallet = Wallet.fromMnemonic(mnemonic)
        }

        if (!wallet) throw new Error('Invalid secret recovery phrase')
        setMemWallet(wallet)

        await addExternalSigner({ signer: wallet.privateKey })
      } catch (e) {
        addToast(e.message || e, { error: true })
      }
    })()
  }, [memWallet, handleSubmit, addExternalSigner, addToast])

  return (
    <>
      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            onBlur={onBlur}
            placeholder={t('Recovery phrase')}
            onChangeText={(props) => {
              if (memWallet) {
                setMemWallet(null)
              }
              onChange(props)
            }}
            autoFocus={isWeb}
            onSubmitEditing={handleFormSubmit}
            value={value}
            error={errors.signer && (t('Please fill in a valid recovery phrase.') as string)}
            info={
              t(
                'Enter secret recovery/mnemonic phrase. Each word should be separated by space or comma.'
              ) as string
            }
          />
        )}
        name="signer"
      />

      <Button
        disabled={isSubmitting || !watch('signer', '')}
        type="outline"
        text={isSubmitting ? t('Logging in...') : t('Log In')}
        onPress={handleFormSubmit}
      />
    </>
  )
}

export default RecoveryPhraseForm
