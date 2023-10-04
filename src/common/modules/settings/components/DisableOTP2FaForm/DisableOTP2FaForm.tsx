import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import Button from '@common/components/Button'
import Input from '@common/components/Input'
import Text from '@common/components/Text'
import useAccounts from '@common/hooks/useAccounts'
import useOtp2Fa from '@common/modules/settings/hooks/useOtp2Fa'
import spacings from '@common/styles/spacings'

interface Props {}

export interface DisableOTP2FaFormValues {
  emailConfirmCode: string
  otpCode: string
}

const DisableOTP2FaForm: React.FC<Props> = () => {
  const { t } = useTranslation()
  const { account } = useAccounts()
  const {
    control,
    handleSubmit,
    formState: { isSubmitting, isValid }
  } = useForm({
    reValidateMode: 'onChange',
    defaultValues: {
      emailConfirmCode: '',
      otpCode: ''
    }
  })

  const { disableOTP } = useOtp2Fa({
    accountId: account?.id,
    email: account?.email
  })

  const onSubmit = useCallback(
    (formValues: DisableOTP2FaFormValues) => disableOTP(formValues),
    [disableOTP]
  )

  return (
    <>
      <Text fontSize={15} weight="regular" style={spacings.mbSm}>
        {t('To disable the two factor authentication, enter the code from your authenticator app:')}
      </Text>
      <Controller
        control={control}
        rules={{ required: t('Please fill in a code.') as string }}
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            onBlur={onBlur}
            placeholder={t('OTP code')}
            onChangeText={onChange}
            value={value}
            keyboardType="email-address"
            containerStyle={spacings.mb}
          />
        )}
        name="otpCode"
      />

      <Button
        disabled={isSubmitting || !isValid}
        text={isSubmitting ? t('Disabling...') : t('Disable 2FA')}
        onPress={handleSubmit(onSubmit)}
        style={spacings.mbLg}
      />
    </>
  )
}

export default DisableOTP2FaForm
