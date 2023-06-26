import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Keyboard, TouchableWithoutFeedback, View } from 'react-native'

import LeftArrowIcon from '@common/assets/svg/LeftArrowIcon'
import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import Input from '@common/components/Input'
import InputPassword from '@common/components/InputPassword'
import NavIconWrapper from '@common/components/NavIconWrapper'
import Text from '@common/components/Text'
import Wrapper, { WRAPPER_TYPES } from '@common/components/Wrapper'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { HEADER_HEIGHT } from '@common/modules/header/components/Header/styles'
import KeyStoreLogo from '@common/modules/vault/components/KeyStoreLogo'
import { VAULT_STATUS } from '@common/modules/vault/constants/vaultStatus'
import { VaultContextReturnType } from '@common/modules/vault/contexts/vaultContext/types'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import { isValidPin, PIN_LENGTH } from '@common/utils/isValidPin'

interface Props {
  hasGradientBackground?: boolean
  onGoBack?: () => void
  // Do not use `useVault` hook in this component because it is causing a
  // require cycle (this component is also used in the vaultContext).
  resetVault: VaultContextReturnType['resetVault']
  vaultStatus: VaultContextReturnType['vaultStatus']
}

const ResetVaultScreen: React.FC<Props> = ({
  hasGradientBackground = true,
  onGoBack = () => {},
  resetVault,
  vaultStatus
}) => {
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

  const BackgroundWrapper = hasGradientBackground ? GradientBackgroundWrapper : React.Fragment

  return (
    <BackgroundWrapper>
      <TouchableWithoutFeedback
        onPress={() => {
          !isWeb && Keyboard.dismiss()
        }}
      >
        <>
          {/* When locked temporarily, the component is mounted as an absolute */}
          {/* positioned overlay, which has no title. So this custom header */}
          {/* serves two purposes: 1) allows the user to go back and */}
          {/* 2) compensates the missing title vertical gap and aligns better */}
          {vaultStatus === VAULT_STATUS.LOCKED_TEMPORARILY && (
            <View style={[{ height: HEADER_HEIGHT }, spacings.ml]}>
              <NavIconWrapper onPress={onGoBack}>
                <LeftArrowIcon withRect />
              </NavIconWrapper>
            </View>
          )}
          <Wrapper
            contentContainerStyle={spacings.pbLg}
            type={WRAPPER_TYPES.KEYBOARD_AWARE_SCROLL_VIEW}
            extraHeight={220}
          >
            <KeyStoreLogo />
            <View style={[isWeb && spacings.ph, flexboxStyles.flex1, flexboxStyles.justifyEnd]}>
              <View style={spacings.phTy}>
                <Text weight="regular" style={spacings.mbMi} fontSize={13}>
                  {t(
                    'Ambire does not keep a copy of your Key Store PIN. If you’re having trouble unlocking your {{name}}, you will need to create a new Key Store PIN.',
                    { name: isWeb ? t('extension') : t('app') }
                  )}
                </Text>
                <Text weight="regular" style={spacings.mbTy} fontSize={13}>
                  {t('This action will remove all your accounts from this device!')}
                </Text>
              </View>
              <Controller
                control={control}
                rules={{
                  required: t('PIN is required.'),
                  validate: { isValidPin }
                }}
                render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                  <InputPassword
                    onBlur={onBlur}
                    placeholder={t('New {{PIN_LENGTH}}-digit PIN', { PIN_LENGTH })}
                    onChangeText={onChange}
                    maxLength={PIN_LENGTH}
                    isValid={value?.length === PIN_LENGTH}
                    value={value}
                    error={error && error.message}
                    containerStyle={spacings.mbTy}
                    onSubmitEditing={handleSubmit(resetVault)}
                    autoFocus={isWeb}
                    keyboardType="number-pad"
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
                    placeholder={t('Repeat PIN')}
                    onChangeText={onChange}
                    value={value}
                    maxLength={PIN_LENGTH}
                    isValid={!!value && watch('password', '') === value}
                    secureTextEntry
                    error={errors.confirmPassword && (t("PINs don't match.") as string)}
                    autoCorrect={false}
                    containerStyle={spacings.mbTy}
                    onSubmitEditing={handleSubmit(resetVault)}
                    keyboardType="number-pad"
                  />
                )}
                name="confirmPassword"
              />

              <View style={spacings.ptSm}>
                <Button
                  disabled={isSubmitting || !watch('password', '') || !watch('confirmPassword', '')}
                  text={
                    // eslint-disable-next-line no-nested-ternary
                    isSubmitting ? t('Resetting...') : t('Reset PIN')
                  }
                  onPress={handleSubmit(resetVault)}
                />
              </View>
            </View>
          </Wrapper>
        </>
      </TouchableWithoutFeedback>
    </BackgroundWrapper>
  )
}

export default React.memo(ResetVaultScreen)
