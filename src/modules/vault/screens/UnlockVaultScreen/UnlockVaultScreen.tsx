import { isValidPassword } from 'ambire-common/src/services/validations'
import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Keyboard, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'

import { isWeb } from '@config/env'
import { useTranslation } from '@config/localization'
import Button from '@modules/common/components/Button'
import GradientBackgroundWrapper from '@modules/common/components/GradientBackgroundWrapper'
import InputPassword from '@modules/common/components/InputPassword'
import Text from '@modules/common/components/Text'
import Wrapper, { WRAPPER_TYPES } from '@modules/common/components/Wrapper'
import spacings from '@modules/common/styles/spacings'
import flexboxStyles from '@modules/common/styles/utils/flexbox'
import KeyStoreLogo from '@modules/vault/components/KeyStoreLogo'
import useVault from '@modules/vault/hooks/useVault'

const UnlockVaultScreen = ({ navigation }: any) => {
  const { t } = useTranslation()
  const { unlockVault } = useVault()

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
              rules={{ validate: isValidPassword }}
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
            <View style={[flexboxStyles.alignCenter, spacings.pvTy]}>
              <TouchableOpacity
                onPress={() => navigation.navigate('resetVault', { resetPassword: true })}
                hitSlop={{ top: 10, bottom: 15 }}
              >
                <Text weight="medium" fontSize={12}>
                  Forgot Key Store passphrase?
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Wrapper>
      </TouchableWithoutFeedback>
    </GradientBackgroundWrapper>
  )
}

export default UnlockVaultScreen
