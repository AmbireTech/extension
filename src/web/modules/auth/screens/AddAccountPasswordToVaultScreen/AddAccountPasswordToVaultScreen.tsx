import { isValidPassword } from 'ambire-common/src/services/validations'
import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Keyboard, View } from 'react-native'

import KeyStoreIcon from '@common/assets/svg/KeyStoreIcon'
import Button from '@common/components/Button'
import InputPassword from '@common/components/InputPassword'
import Text from '@common/components/Text'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useDisableNavigatingBack from '@common/hooks/useDisableNavigatingBack'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useEmailLogin from '@common/modules/auth/hooks/useEmailLogin'
import useJsonLogin from '@common/modules/auth/hooks/useJsonLogin'
import colors from '@common/styles/colors'
import spacings, { IS_SCREEN_SIZE_S } from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import { delayPromise } from '@common/utils/promises'
import {
  AuthLayoutWrapperMainContent,
  AuthLayoutWrapperSideContent
} from '@web/components/AuthLayoutWrapper/AuthLayoutWrapper'

const AddAccountPasswordToVaultScreen = () => {
  const { t } = useTranslation()
  const route = useRoute()
  const {
    pendingLoginAccount: pendingEmailLoginAccount,
    handleLogin: handleEmailLogin,
    cancelLoginAttempts: cancelEmailLoginAttempts
  } = useEmailLogin()
  const {
    handleLogin: handleJsonLogin,
    pendingLoginWithQuickAccountData: pendingJsonLoginAccount,
    cancelLoginAttempts: cancelJsonLoginAttempts
  } = useJsonLogin()
  const navigation = useNavigation()
  const { loginType } = route.params

  useDisableNavigatingBack(navigation)
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    reValidateMode: 'onChange',
    defaultValues: {
      password: ''
    }
  })

  const handleFormSubmit = useCallback(() => {
    !isWeb && Keyboard.dismiss()

    handleSubmit(async ({ password }) => {
      // wait state update before Wallet calcs because
      // when Wallet method is called on devices with slow CPU the UI freezes
      await delayPromise(100)

      loginType === 'email'
        ? await handleEmailLogin({ password })
        : await handleJsonLogin({ password })
    })()
  }, [handleSubmit, handleEmailLogin, handleJsonLogin, loginType])

  const handleCancelLoginAttempts = useCallback(() => {
    loginType === 'email' ? cancelEmailLoginAttempts() : cancelJsonLoginAttempts()
    navigation.goBack()
  }, [cancelEmailLoginAttempts, cancelJsonLoginAttempts, navigation, loginType])

  return (
    <>
      <AuthLayoutWrapperMainContent>
        <View style={[flexboxStyles.justifyCenter, flexboxStyles.alignCenter, spacings.pv]}>
          <KeyStoreIcon height={IS_SCREEN_SIZE_S ? 96 : 136} width={120} />
        </View>

        <View>
          <Text weight="regular" style={[spacings.mbMi, spacings.phTy]} fontSize={13}>
            {t(
              'When you add your account password to the Key Store, you will be able to sign transactions on this device using your passphrase only.'
            )}
          </Text>
          <Text weight="regular" style={[spacings.mb, spacings.phTy]} fontSize={13}>
            {t(
              'If you reset your passphrase or {{action}}, the Key Store will be removed from the device, however you can still use your account password on any other device.',
              { action: isWeb ? t('remove the extension') : t('uninstall the app') }
            )}
          </Text>

          <Controller
            control={control}
            rules={{ validate: isValidPassword }}
            render={({ field: { onChange, onBlur, value } }) => (
              <InputPassword
                onBlur={onBlur}
                placeholder={t('Ambire account password')}
                onChangeText={onChange}
                isValid={isValidPassword(value)}
                autoFocus={isWeb}
                disabled={isSubmitting}
                value={value}
                info={t('Enter the password for account {{accountAddr}}', {
                  accountAddr: `${
                    loginType === 'email'
                      ? pendingEmailLoginAccount?._id?.slice(0, 4)
                      : pendingJsonLoginAccount?.id?.slice(0, 4)
                  }...${
                    loginType === 'email'
                      ? pendingEmailLoginAccount?._id?.slice(-4)
                      : pendingJsonLoginAccount?.id?.slice(-4)
                  }`
                })}
                error={
                  errors.password &&
                  (t('Please fill in at least 8 characters for password.') as string)
                }
                onSubmitEditing={handleFormSubmit}
              />
            )}
            name="password"
          />

          <Button
            disabled={isSubmitting || !watch('password', '')}
            text={isSubmitting ? t('Adding to Key Store...') : t('Add password to Key Store')}
            onPress={handleFormSubmit}
          />

          <Button
            type="outline"
            accentColor={colors.howl}
            text={t('Cancel Login Attempt')}
            onPress={handleCancelLoginAttempts}
          />
        </View>
      </AuthLayoutWrapperMainContent>
      <AuthLayoutWrapperSideContent backgroundType="beta">
        <Text weight="regular" color={colors.titan}>
          {t(
            'When you add your account password to the Key Store, you will be able to sign transactions on this device using your passphrase only.'
          )}
        </Text>
      </AuthLayoutWrapperSideContent>
    </>
  )
}

export default AddAccountPasswordToVaultScreen
