import { isValidPassword } from 'ambire-common/src/services/validations'
import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Keyboard, TouchableWithoutFeedback, View } from 'react-native'

import KeyStoreIcon from '@common/assets/svg/KeyStoreIcon'
import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import InputPassword from '@common/components/InputPassword'
import Text from '@common/components/Text'
import Wrapper, { WRAPPER_TYPES } from '@common/components/Wrapper'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useDisableNavigatingBack from '@common/hooks/useDisableNavigatingBack'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useEmailLogin from '@common/modules/auth/hooks/useEmailLogin'
import useJsonLogin from '@common/modules/auth/hooks/useJsonLogin'
import spacings, { IS_SCREEN_SIZE_S } from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import { delayPromise } from '@common/utils/promises'

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
    <GradientBackgroundWrapper>
      <TouchableWithoutFeedback
        onPress={() => {
          !isWeb && Keyboard.dismiss()
        }}
      >
        <Wrapper
          contentContainerStyle={spacings.pbLg}
          type={WRAPPER_TYPES.KEYBOARD_AWARE_SCROLL_VIEW}
          extraHeight={220}
        >
          <View style={[flexboxStyles.justifyCenter, flexboxStyles.alignCenter, spacings.pv]}>
            <KeyStoreIcon height={IS_SCREEN_SIZE_S ? 96 : 136} width={120} />
          </View>

          <View style={[isWeb && spacings.ph, flexboxStyles.flex1, flexboxStyles.justifyEnd]}>
            <Text weight="regular" style={[spacings.mbTy, spacings.phTy]} fontSize={14}>
              {t(
                'Add your account password to the Key Store and you can sign transactions and unlock wallet using PIN only.'
              )}
            </Text>
            <Text weight="regular" style={[spacings.mb, spacings.phTy]} fontSize={14}>
              {t(
                'If you delete the app, the Key Store and PIN will be lost, but you can still use your account password on any other device.'
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
              type="ghost"
              text={t('Cancel Login Attempt')}
              onPress={handleCancelLoginAttempts}
            />
          </View>
        </Wrapper>
      </TouchableWithoutFeedback>
    </GradientBackgroundWrapper>
  )
}

export default AddAccountPasswordToVaultScreen
