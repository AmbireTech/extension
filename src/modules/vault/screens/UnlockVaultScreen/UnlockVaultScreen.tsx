import { isValidPassword } from 'ambire-common/src/services/validations'
import React, { useCallback, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Keyboard, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'

import { isWeb } from '@config/env'
import { useTranslation } from '@config/localization'
import useBiometricsSign from '@modules/biometrics-sign/hooks/useBiometricsSign'
import Button from '@modules/common/components/Button'
import GradientBackgroundWrapper from '@modules/common/components/GradientBackgroundWrapper'
import InputPassword from '@modules/common/components/InputPassword'
import Text from '@modules/common/components/Text'
import Wrapper, { WRAPPER_TYPES } from '@modules/common/components/Wrapper'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'
import KeyStoreLogo from '@modules/vault/components/KeyStoreLogo'
import useVault from '@modules/vault/hooks/useVault'

const FOOTER_BUTTON_HIT_SLOP = { top: 10, bottom: 15 }

const UnlockVaultScreen = ({ navigation }: any) => {
  const { t } = useTranslation()
  const { unlockVault } = useVault()
  const { biometricsEnabled } = useBiometricsSign()
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    reValidateMode: 'onChange',
    defaultValues: {
      password: ''
    }
  })

  useEffect(() => {
    if (!biometricsEnabled) {
      return
    }

    handleSubmit(unlockVault)()
  }, [biometricsEnabled, handleSubmit, unlockVault])

  const handleRetryBiometrics = useCallback(() => {
    setValue('password', '')
    return handleSubmit(unlockVault)()
  }, [handleSubmit, unlockVault, setValue])

  const handleForgotPassword = useCallback(
    () => navigation.navigate('resetVault', { resetPassword: true }),
    [navigation]
  )

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
          <KeyStoreLogo />

          <View style={[isWeb && spacings.ph, flexboxStyles.flex1, flexboxStyles.justifyEnd]}>
            <Text weight="regular" style={[spacings.mbTy, spacings.phTy]} fontSize={13}>
              {t('Enter your Ambire Key Store passphrase to unlock your wallet')}
            </Text>

            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <InputPassword
                  onBlur={onBlur}
                  placeholder={t('Passphrase')}
                  autoFocus={isWeb}
                  onChangeText={onChange}
                  isValid={isValidPassword(value)}
                  value={value}
                  onSubmitEditing={handleSubmit(unlockVault)}
                  error={
                    errors.password &&
                    (t('Please fill in at least 8 characters for passphrase.') as string)
                  }
                  containerStyle={spacings.mbTy}
                />
              )}
              name="password"
            />

            <View style={spacings.ptSm}>
              <Button
                disabled={isSubmitting || !watch('password', '')}
                text={isSubmitting ? t('Unlocking...') : t('Unlock')}
                onPress={handleSubmit(unlockVault)}
              />
            </View>
            <View style={[flexboxStyles.justifyCenter, flexboxStyles.directionRow, spacings.pvTy]}>
              <TouchableOpacity onPress={handleForgotPassword} hitSlop={FOOTER_BUTTON_HIT_SLOP}>
                <Text weight="medium" fontSize={12}>
                  {t('Forgot Key Store passphrase?')}
                </Text>
              </TouchableOpacity>
              {biometricsEnabled && (
                <>
                  <Text weight="medium" fontSize={12}>
                    {' | '}
                  </Text>
                  <TouchableOpacity
                    onPress={handleRetryBiometrics}
                    hitSlop={FOOTER_BUTTON_HIT_SLOP}
                  >
                    <Text weight="medium" fontSize={12}>
                      {t('Retry biometrics')}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Wrapper>
      </TouchableWithoutFeedback>
    </GradientBackgroundWrapper>
  )
}

export default UnlockVaultScreen
