import { isValidPassword } from 'ambire-common/src/services/validations'
import React, { useCallback, useEffect } from 'react'
import { Controller, FieldError, useFormContext, UseFormSetError } from 'react-hook-form'
import { Keyboard, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'

import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import InputPassword from '@common/components/InputPassword'
import Text from '@common/components/Text'
import Wrapper, { WRAPPER_TYPES } from '@common/components/Wrapper'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useDisableNavigatingBack from '@common/hooks/useDisableNavigatingBack'
import useNavigation from '@common/hooks/useNavigation'
import { HEADER_HEIGHT } from '@common/modules/header/components/Header/styles'
import { ROUTES } from '@common/modules/router/constants/common'
import KeyStoreLogo from '@common/modules/vault/components/KeyStoreLogo'
import NumericPadWithBiometrics from '@common/modules/vault/components/NumericPadWithBiometrics'
import { VAULT_STATUS } from '@common/modules/vault/constants/vaultStatus'
import {
  VAULT_PASSWORD_TYPE,
  VaultContextReturnType
} from '@common/modules/vault/contexts/vaultContext/types'
import useBiometricsHasChanged from '@common/modules/vault/hooks/useBiometricsHasChanged'
import useVault from '@common/modules/vault/hooks/useVault'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import { PIN_LENGTH } from '@common/utils/isValidPin'

const FOOTER_BUTTON_HIT_SLOP = { top: 10, bottom: 15 }

interface Props {
  hasGradientBackground?: boolean
  onForgotPassword?: () => void
  // Do not use `useVault` hook in this component because it is causing a
  // require cycle (this component is also used in the vaultContext).
  unlockVault: (
    { password }: { password: string },
    setError: UseFormSetError<{ password: string }>,
    biometricsHasChanged: boolean
  ) => Promise<any>
  vaultStatus: VaultContextReturnType['vaultStatus']
  biometricsEnabled: VaultContextReturnType['biometricsEnabled']
}

const UnlockVaultScreen: React.FC<Props> = ({
  onForgotPassword = () => {},
  unlockVault,
  vaultStatus,
  biometricsEnabled,
  hasGradientBackground = true
}) => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { vaultPasswordType } = useVault()
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting }
  } = useFormContext()
  const { biometricsHasChanged } = useBiometricsHasChanged(
    errors.password?.message as FieldError['message']
  )

  useEffect(() => {
    if (!biometricsEnabled) {
      return
    }

    // Trigger only when the vault is locked, which is the case when the app
    // gets opened for the first time. Otherwise, when the vault gets
    // temporary locked (when app goes inactive), this trigger is
    // getting fired immediately when the app goes inactive,
    // not when the app comes back in active state. Which messes up
    // the biometrics prompt (it freezes and the promise never resolves).
    if (vaultStatus === VAULT_STATUS.LOCKED) {
      // Always assume that biometrics has not been changed when trying to
      // unlock the fault the first time. There's no way to know this,
      // other than trying to unlock and hitting the biometrics changed error.
      handleSubmit((data) => unlockVault(data, setError, false))()
    }
  }, [biometricsEnabled, handleSubmit, setError, unlockVault, vaultStatus])

  const handleRetryBiometrics = useCallback(() => {
    setValue('password', '')
    // Always assume that biometrics has not been changed when re-trying
    // to unlock with biometrics. Otherwise, the retry won't really... retry
    // because passing `true` here will trigger the re-enable biometrics flow
    // instead of actually re-trying to unlock with biometrics.
    return handleSubmit((data) => unlockVault(data, setError, false))()
  }, [setValue, handleSubmit, unlockVault, setError])

  const handleForgotPassword = useCallback(() => {
    // Navigate only if vault is locked, which means that the VaultStack
    // is mounted and the reset vault screen route exists.
    // Otherwise, the user is in another navigation stack (or in temporarily
    // locked state), so the reset vault screen route doesn't exist.
    if (vaultStatus === VAULT_STATUS.LOCKED) {
      navigate(ROUTES.resetVault, {
        state: {
          resetPassword: true
        }
      })
    }

    onForgotPassword()
  }, [vaultStatus, onForgotPassword, navigate])

  useDisableNavigatingBack()

  const BackgroundWrapper = hasGradientBackground ? GradientBackgroundWrapper : React.Fragment

  const currentPassword = watch('password')
  const isPinEntry = vaultPasswordType === VAULT_PASSWORD_TYPE.PIN

  useEffect(() => {
    // Auto-submit only when a PIN gets entered
    if (!isPinEntry) return

    // when password is 6 characters, submit the form
    if (currentPassword.length === PIN_LENGTH) {
      setTimeout(
        () => {
          handleSubmit((data) => unlockVault(data, setError, biometricsHasChanged))()
          reset()
        },
        // Slight delay to allow the user to "see" the last digit entered
        200
      )
    }
  }, [
    handleSubmit,
    setError,
    unlockVault,
    currentPassword,
    reset,
    isPinEntry,
    biometricsHasChanged
  ])

  return (
    <BackgroundWrapper>
      <TouchableWithoutFeedback
        onPress={() => {
          !isWeb && Keyboard.dismiss()
        }}
      >
        <Wrapper
          contentContainerStyle={[
            spacings.pbLg,
            // When locked temporarily, the component is mounted as an absolute
            // positioned overlay, which has no title. So the top margin
            // compensates the missing title and aligns the KeyStoreLogo better.
            vaultStatus === VAULT_STATUS.LOCKED_TEMPORARILY && { marginTop: HEADER_HEIGHT }
          ]}
          type={WRAPPER_TYPES.KEYBOARD_AWARE_SCROLL_VIEW}
          extraHeight={220}
        >
          <KeyStoreLogo />

          <View style={[isWeb && spacings.ph, flexboxStyles.flex1, flexboxStyles.justifyEnd]}>
            <Text
              weight="regular"
              style={[spacings.phTy, isPinEntry ? text.center : spacings.mbTy]}
              fontSize={13}
            >
              {isPinEntry
                ? t('Enter Ambire Key Store PIN')
                : t('Enter your Ambire Key Store passphrase to unlock your wallet')}
            </Text>

            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) =>
                isPinEntry ? (
                  <NumericPadWithBiometrics
                    biometricsEnabled={biometricsEnabled}
                    retryBiometrics={handleRetryBiometrics}
                    setValue={setValue}
                    isDisabled={isSubmitting || currentPassword.length === PIN_LENGTH}
                    value={currentPassword}
                    error={errors?.password?.message}
                  />
                ) : (
                  <InputPassword
                    onBlur={onBlur}
                    placeholder={t('Passphrase')}
                    autoFocus={isWeb}
                    onChangeText={onChange}
                    isValid={isValidPassword(value)}
                    value={value}
                    onSubmitEditing={handleSubmit((data) =>
                      unlockVault(data, setError, biometricsHasChanged)
                    )}
                    error={
                      errors.password &&
                      (errors.password.message ||
                        t('Please fill in at least 8 characters for passphrase.'))
                    }
                    containerStyle={spacings.mbTy}
                  />
                )
              }
              name="password"
            />

            {!isPinEntry && (
              <View style={spacings.ptSm}>
                <Button
                  disabled={isSubmitting || !watch('password', '')}
                  text={isSubmitting ? t('Unlocking...') : t('Unlock')}
                  onPress={handleSubmit((data) =>
                    unlockVault(data, setError, biometricsHasChanged)
                  )}
                />
              </View>
            )}
            <View style={[flexboxStyles.justifyCenter, flexboxStyles.directionRow, spacings.pvTy]}>
              <TouchableOpacity onPress={handleForgotPassword} hitSlop={FOOTER_BUTTON_HIT_SLOP}>
                <Text weight="medium" fontSize={12}>
                  {isPinEntry ? t('Forgot Key Store PIN?') : t('Forgot Key Store passphrase?')}
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
                    disabled={isSubmitting}
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
    </BackgroundWrapper>
  )
}

export default React.memo(UnlockVaultScreen)
