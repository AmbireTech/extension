import { isValidPassword } from 'ambire-common/src/services/validations'
import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import Button from '@modules/common/components/Button'
import Input from '@modules/common/components/Input'
import InputPassword from '@modules/common/components/InputPassword'
import Title from '@modules/common/components/Title'
import spacings from '@modules/common/styles/spacings'
import textStyles from '@modules/common/styles/utils/text'

type Props = {
  shouldConfirm?: boolean
  onAuthorize: (props: { password: string; confirmPassword?: string }) => any
}

const ExternalSignerAuthorization = ({ shouldConfirm, onAuthorize }: Props) => {
  const { t } = useTranslation()
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    reValidateMode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  })
  return (
    <View>
      <Title style={textStyles.center}>{t('Create Password')}</Title>
      <Controller
        control={control}
        rules={{ validate: isValidPassword }}
        render={({ field: { onChange, onBlur, value } }) => (
          <InputPassword
            onBlur={onBlur}
            placeholder={t('Password')}
            onChangeText={onChange}
            isValid={isValidPassword(value)}
            value={value}
            error={errors.password && (t('Please fill in a valid password.') as string)}
            containerStyle={spacings.mbTy}
          />
        )}
        name="password"
      />
      {shouldConfirm && (
        <Controller
          control={control}
          rules={{
            validate: (value) => watch('password', '') === value
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              onBlur={onBlur}
              placeholder={t('Confirm password')}
              onChangeText={onChange}
              value={value}
              isValid={!!value && watch('password', '') === value}
              secureTextEntry
              error={errors.confirmPassword && (t("Passwords don't match.") as string)}
              autoCorrect={false}
            />
          )}
          name="confirmPassword"
        />
      )}
      <Button
        disabled={isSubmitting}
        text={isSubmitting ? t('Loading...') : t('Create Password')}
        onPress={handleSubmit(onAuthorize)}
      />
    </View>
  )
}

export default ExternalSignerAuthorization
