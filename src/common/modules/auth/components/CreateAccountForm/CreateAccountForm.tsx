import accountPresets from 'ambire-common/src/constants/accountPresets'
import { isEmail, isValidPassword } from 'ambire-common/src/services/validations'
import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Trans } from 'react-i18next'
import { LayoutAnimation, Linking, View } from 'react-native'

import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import Input from '@common/components/Input'
import InputPassword from '@common/components/InputPassword'
import Text from '@common/components/Text'
import Title from '@common/components/Title'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { ambireCloudURL, termsAndPrivacyURL } from '@common/modules/auth/constants/URLs'
import useCreateAccount from '@common/modules/auth/hooks/useCreateAccount'
import { triggerLayoutAnimation } from '@common/services/layoutAnimation'
import colors from '@common/styles/colors'
import spacings from '@common/styles/spacings'
import text from '@common/styles/utils/text'

const days = Math.ceil(accountPresets.quickAccTimelock / 86400)

const AddNewAccountScreen: React.FC<any> = () => {
  const { t } = useTranslation()
  const {
    handleAddNewAccount,
    err,
    addAccErr,
    requiresEmailConfFor,
    resendTimeLeft,
    sendConfirmationEmail
  } = useCreateAccount()
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    reValidateMode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      terms: false,
      backup: true,
      noBackup: false
    }
  })

  const handleFormSubmit = useCallback(() => {
    handleSubmit(handleAddNewAccount)()
  }, [])

  if (requiresEmailConfFor) {
    return (
      <View>
        <Title type="small" style={text.center}>
          {t('Email confirmation required')}
        </Title>
        <Controller
          control={control}
          rules={{ validate: isEmail }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              onBlur={onBlur}
              placeholder={t('Email')}
              onChangeText={onChange}
              value={value}
              autoFocus={isWeb}
              isValid={isEmail(value)}
              error={errors.email && (t('Please fill in a valid email.') as string)}
              keyboardType="email-address"
              containerStyle={spacings.mbTy}
              disabled
              info={`We sent an email to ${value}. Please check your inbox for "Welcome to Ambire Wallet" email and click "Verify".`}
            />
          )}
          name="email"
        />
        <View style={spacings.ptSm}>
          <Button
            type="ghost"
            text={resendTimeLeft === 0 ? t('Resend') : t(`Resend in ${resendTimeLeft / 1000} secs`)}
            onPress={sendConfirmationEmail}
            textStyle={!resendTimeLeft && { color: colors.turquoise }}
            disabled={!!resendTimeLeft}
          />
        </View>
      </View>
    )
  }

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
            value={value}
            autoFocus={isWeb}
            isValid={isEmail(value)}
            error={errors.email && (t('Please fill in a valid email.') as string)}
            keyboardType="email-address"
            containerStyle={spacings.mbTy}
          />
        )}
        name="email"
      />
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
            error={
              errors.password && (t('Please fill in at least 8 characters for password.') as string)
            }
            containerStyle={spacings.mbTy}
          />
        )}
        name="password"
      />
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
      <Controller
        control={control}
        rules={{
          required: true
        }}
        render={({ field: { onChange, value } }) => (
          <Checkbox value={value} onValueChange={() => onChange(!value)}>
            <Trans t={t}>
              <Text fontSize={12}>
                <Text fontSize={12} onPress={() => onChange(!value)}>
                  {'I agree to the '}
                </Text>
                <Text fontSize={12} onPress={() => Linking.openURL(termsAndPrivacyURL)} underline>
                  Terms of Service and Privacy policy.
                </Text>
              </Text>
            </Trans>
          </Checkbox>
        )}
        name="terms"
      />

      {!!errors.terms && (
        <Text appearance="danger" fontSize={12} style={spacings.mb}>
          {t('Please agree to our Terms of Service and Privacy policy.')}
        </Text>
      )}

      <Controller
        control={control}
        render={({ field: { onChange, value } }) => (
          <Checkbox
            value={value}
            onValueChange={() => {
              onChange(!value)
              triggerLayoutAnimation({
                forceAnimate: true,
                config: LayoutAnimation.create(300, 'linear', 'opacity')
              })
            }}
          >
            <Trans t={t}>
              <Text fontSize={12}>
                <Text fontSize={12} onPress={() => onChange(!value)}>
                  {'Backup on '}
                </Text>
                <Text fontSize={12} onPress={() => Linking.openURL(ambireCloudURL)} underline>
                  Ambire Cloud.
                </Text>
              </Text>
            </Trans>
          </Checkbox>
        )}
        name="backup"
      />
      <Controller
        control={control}
        rules={{
          required: watch('backup', true) === false
        }}
        render={({ field: { onChange, value } }) =>
          watch('backup', true) === false ? (
            <Checkbox value={value} onValueChange={() => onChange(!value)}>
              <Text fontSize={12} onPress={() => onChange(!value)}>
                {t(
                  'In case you forget your password or lose your backup, you will have to wait {{days}} days and pay the recovery fee to restore access to your account.',
                  { days }
                )}
              </Text>
            </Checkbox>
          ) : (
            // eslint-disable-next-line react/jsx-no-useless-fragment
            <></>
          )
        }
        name="noBackup"
      />
      {!!errors.noBackup && watch('backup', true) === false && (
        <Text appearance="danger" style={spacings.mb} fontSize={12}>
          {t('Please tick this box if you want to proceed.')}
        </Text>
      )}

      <View style={spacings.ptSm}>
        <Button
          disabled={
            isSubmitting ||
            !watch('email', '') ||
            !watch('password', '') ||
            !watch('confirmPassword', '')
          }
          text={isSubmitting ? t('Signing Up...') : t('Sign Up')}
          onPress={handleFormSubmit}
        />
      </View>
      {!!err && (
        <Text appearance="danger" style={spacings.mbSm}>
          {err}
        </Text>
      )}
      {!!addAccErr && (
        <Text appearance="danger" style={spacings.mbSm}>
          {addAccErr}
        </Text>
      )}
    </>
  )
}

export default AddNewAccountScreen
