import { isEmail } from 'ambire-common/src/services/validations'
import React, { useCallback, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Keyboard } from 'react-native'

import Button from '@common/components/Button'
import Input from '@common/components/Input'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useTheme from '@common/hooks/useTheme'
import useEmailLogin from '@common/modules/auth/hooks/useEmailLogin'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
import { delayPromise } from '@common/utils/promises'

const EmailLoginForm: React.FC<any> = () => {
  const { t } = useTranslation()
  const { themeType } = useTheme()
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    reValidateMode: 'onChange',
    defaultValues: {
      email: ''
    }
  })

  const {
    handleLogin,
    cancelLoginAttempts,
    requiresEmailConfFor,
    requiresPassword,
    pendingLoginAccount
  } = useEmailLogin()

  useEffect(() => {
    if (requiresEmailConfFor) {
      setValue('email', requiresEmailConfFor?.email || '')
    }
    if (!requiresEmailConfFor) setValue('email', '')
  }, [requiresEmailConfFor, setValue])

  const handleFormSubmit = useCallback(() => {
    !isWeb && Keyboard.dismiss()
    handleSubmit(async ({ email }) => {
      // wait state update before Wallet calcs because
      // when Wallet method is called on devices with slow CPU the UI freezes
      await delayPromise(100)

      await handleLogin({ email })
    })()
  }, [handleSubmit, handleLogin])

  const handleCancelLoginAttempts = useCallback(() => {
    setValue('email', '')
    cancelLoginAttempts()
  }, [cancelLoginAttempts, setValue])

  return (
    <>
      <Controller
        control={control}
        rules={{ validate: isEmail }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            onBlur={onBlur}
            placeholder={t('Email')}
            onChangeText={onChange}
            onSubmitEditing={handleSubmit(handleLogin)}
            value={value}
            autoFocus={isWeb}
            isValid={isEmail(value)}
            validLabel={pendingLoginAccount ? t('Email address confirmed') : ''}
            keyboardType="email-address"
            disabled={!!requiresEmailConfFor && !pendingLoginAccount}
            info={
              requiresEmailConfFor && !pendingLoginAccount
                ? t(
                    'We sent an email to {{email}}, please check your inbox and click Authorize New Device.',
                    { email: requiresEmailConfFor?.email }
                  )
                : ''
            }
            error={errors.email && (t('Please fill in a valid email.') as string)}
            containerStyle={requiresPassword ? spacings.mbTy : null}
          />
        )}
        name="email"
      />

      <Button
        disabled={
          (!!requiresEmailConfFor && !pendingLoginAccount) || isSubmitting || !watch('email', '')
        }
        type="primary"
        text={
          // eslint-disable-next-line no-nested-ternary
          requiresEmailConfFor && !pendingLoginAccount
            ? t('Waiting Email Confirmation')
            : // eslint-disable-next-line no-nested-ternary
            isSubmitting
            ? t('Loading...')
            : !pendingLoginAccount
            ? t('Confirm Email')
            : t('Log In')
        }
        onPress={handleFormSubmit}
      />
      {!!requiresEmailConfFor && (
        <Button
          type={themeType === THEME_TYPES.LIGHT ? 'outline' : 'ghost'}
          accentColor={themeType === THEME_TYPES.LIGHT ? colors.howl : undefined}
          text={t('Cancel Login Attempt')}
          onPress={handleCancelLoginAttempts}
        />
      )}
    </>
  )
}

export default EmailLoginForm
