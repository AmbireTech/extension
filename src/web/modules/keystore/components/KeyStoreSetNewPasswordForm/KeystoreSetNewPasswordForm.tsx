import React, { useCallback, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

import { isValidPassword } from '@ambire-common/services/validations'
import KeyStoreIcon from '@common/assets/svg/KeyStoreIcon'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import InputPassword from '@common/components/InputPassword'
import ScrollableWrapper from '@common/components/ScrollableWrapper'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import useTheme from '@common/hooks/useTheme'
import spacings from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useEmailVaultControllerState from '@web/hooks/useEmailVaultControllerState'

import getStyles from './styles'

const KeystoreSetNewPasswordForm = () => {
  const { t } = useTranslation()

  const emailVault = useEmailVaultControllerState()
  const { dispatch } = useBackgroundService()
  const {
    watch,
    control,
    formState: { errors, isValid, isSubmitting },
    handleSubmit
  } = useForm({
    mode: 'all',
    defaultValues: { password: '', confirmPassword: '' }
  })
  const { styles } = useTheme(getStyles)

  const email = useMemo(() => emailVault.keystoreRecoveryEmail, [emailVault.keystoreRecoveryEmail])
  const password = watch('password')

  const handleSetNewPassword = useCallback(async () => {
    await handleSubmit(({ password: newPass }) => {
      dispatch({
        type: 'EMAIL_VAULT_CONTROLLER_RECOVER_KEYSTORE',
        params: { email, newPass }
      })
    })()
  }, [dispatch, email, handleSubmit])

  return (
    <>
      <ScrollableWrapper>
        <View style={[flexbox.alignCenter, spacings.mbXl]}>
          <KeyStoreIcon />
        </View>
        <Text fontSize={16} weight="semiBold" style={spacings.mbTy}>
          {t('Your email is confirmed!')}
        </Text>
        <Text fontSize={14} appearance="secondaryText" style={spacings.mbSm}>
          {t('To complete the email recovery process, please create a new extension password.')}
        </Text>
        <View style={[styles.currentEmailContainer, spacings.mbLg]}>
          <Text style={text.center} fontSize={14} appearance="secondaryText">
            {t('The recovery email for current extension is')}{' '}
            <Text appearance="primary" fontSize={14} weight="medium">
              {email}
            </Text>
          </Text>
        </View>
        <Controller
          control={control}
          rules={{ validate: isValidPassword }}
          render={({ field: { onChange, onBlur, value } }) => (
            <InputPassword
              label={t('New password')}
              onBlur={onBlur}
              placeholder={t('Enter password')}
              onChangeText={onChange}
              isValid={isValidPassword(value)}
              autoFocus={isWeb}
              value={value}
              error={
                errors.password &&
                (t('Please fill in at least 8 characters for password.') as string)
              }
              containerStyle={spacings.mbTy}
              onSubmitEditing={handleSetNewPassword}
            />
          )}
          name="password"
        />
        <Controller
          control={control}
          rules={{
            validate: (value) => password === value
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label={t('Repeat password')}
              onBlur={onBlur}
              placeholder={t('Enter password')}
              onChangeText={onChange}
              value={value}
              secureTextEntry
              error={errors.confirmPassword && (t("Passwords don't match.") as string)}
              isValid={!!value && !errors.password && password === value}
              validLabel={t('Passwords match')}
              autoCorrect={false}
              onSubmitEditing={handleSetNewPassword}
            />
          )}
          name="confirmPassword"
        />
      </ScrollableWrapper>
      <View style={spacings.pt}>
        <Button
          testID="create-keystore-pass-btn"
          size="large"
          disabled={isSubmitting || !isValid || emailVault.statuses.recoverKeyStore !== 'INITIAL'}
          text={
            isSubmitting || emailVault.statuses.recoverKeyStore !== 'INITIAL'
              ? t('Loading...')
              : t('Confirm')
          }
          onPress={handleSetNewPassword}
          hasBottomSpacing={false}
        />
      </View>
    </>
  )
}

export default React.memo(KeystoreSetNewPasswordForm)
