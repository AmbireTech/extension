import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Keyboard } from 'react-native'

import Button from '@common/components/Button'
import Input from '@common/components/Input'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useToast from '@common/hooks/useToast'
import useExternalSignerLogin from '@common/modules/auth/hooks/useExternalSignerLogin'
import { delayPromise } from '@common/utils/promises'

const PrivateKeyForm: React.FC<any> = () => {
  const { t } = useTranslation()
  const { addExternalSigner } = useExternalSignerLogin()
  const { addToast } = useToast()

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
        const signerValue = signer.slice(0, 2) === '0x' ? signer.slice(2) : signer
        await addExternalSigner({ signer: signerValue })
      } catch (e) {
        addToast(e.message || e, { error: true })
      }
    })()
  }, [handleSubmit, addExternalSigner, addToast])

  return (
    <>
      <Controller
        control={control}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            onBlur={onBlur}
            placeholder={t('Signer private key')}
            onChangeText={onChange}
            onSubmitEditing={handleFormSubmit}
            value={value}
            autoFocus={isWeb}
            error={errors.signer && (t('Please fill in a valid private key.') as string)}
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

export default PrivateKeyForm
