import { isValidPassword as isValidPasswordRule } from 'ambire-common/src/services/validations'
import React, { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Keyboard } from 'react-native'

import Button from '@common/components/Button'
import GradientBackgroundWrapper from '@common/components/GradientBackgroundWrapper'
import InputPassword from '@common/components/InputPassword'
import Panel from '@common/components/Panel'
import Text from '@common/components/Text'
import TextWarning from '@common/components/TextWarning'
import Toggle from '@common/components/Toggle'
import Wrapper from '@common/components/Wrapper'
import { useTranslation } from '@common/config/localization'
import { DEVICE_SECURITY_LEVEL } from '@common/contexts/biometricsContext/constants'
import useBiometrics from '@common/hooks/useBiometrics'
import useIsScreenFocused from '@common/hooks/useIsScreenFocused'
import useToast from '@common/hooks/useToast'
import ManageLockVaultWhenInactive from '@common/modules/vault/components/ManageLockVaultWhenInactive'
import useVault from '@common/modules/vault/hooks/useVault'
import alert from '@common/services/alert'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import { isValidPin, PIN_LENGTH } from '@common/utils/isValidPin'

import { VAULT_PASSWORD_TYPE } from '../../contexts/vaultContext/types'
import styles from './styles'

interface FormValues {
  password: string
}

const ManageVaultLockScreen = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const isFocused = useIsScreenFocused()
  const { hasBiometricsHardware, deviceSecurityLevel } = useBiometrics()
  const {
    isValidPassword,
    addKeystorePasswordToDeviceSecureStore,
    biometricsEnabled,
    removeKeystorePasswordFromDeviceSecureStore,
    vaultPasswordType
  } = useVault()
  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({
    defaultValues: {
      password: ''
    }
  })

  // On going back (loosing routing focus), reset state, otherwise there is
  // no way for the user to reset this form (other than kill the app).
  // Also, resets the state upon initial successful passcode configuring.
  useEffect(() => {
    return () => reset()
  }, [reset, isFocused])

  const isPinEntry = vaultPasswordType === VAULT_PASSWORD_TYPE.PIN
  const passwordLabel = vaultPasswordType === VAULT_PASSWORD_TYPE.PIN ? t('PIN') : t('passphrase')

  const handleEnable = async ({ password }: FormValues) => {
    // Dismiss the keyboard, because the validation process sometimes takes longer,
    // and having the keyboard in there all the time, is strange.
    Keyboard.dismiss()

    const isValidVaultPassword = await isValidPassword({ password })
    if (!isValidVaultPassword) {
      return setError(
        'password',
        {
          type: 'focus',
          message: t('Wrong Ambire Key Store {{passwordLabel}}.', {
            passwordLabel
          })
        },
        { shouldFocus: true }
      )
    }

    let enable = false
    try {
      enable = await addKeystorePasswordToDeviceSecureStore(password)
      if (enable) {
        addToast(t('Unlock with biometrics enabled!') as string, { timeout: 3000 })
      }
    } catch {
      addToast(t('Confirming Biometrics was unsuccessful. Please try again.'), { error: true })
    }

    return enable
  }

  const handleDisableConfirmed = async () => {
    const disabled = await removeKeystorePasswordFromDeviceSecureStore()
    if (disabled) {
      addToast(t('Unlock with biometrics disabled!') as string, { timeout: 3000 })
    }
  }

  const handleDisable = () => {
    alert(
      t('Are you sure you want to disable biometrics?'),
      t(
        'Disabling biometrics will require you to manually input your Ambire Key Store {{passwordLabel}} when needed.',
        { passwordLabel }
      ),
      [
        {
          text: t('Disable biometrics'),
          onPress: handleDisableConfirmed,
          style: 'destructive'
        },
        {
          text: t('Cancel'),
          style: 'cancel'
        }
      ]
    )
  }

  const renderContent = () => {
    if (biometricsEnabled) {
      return (
        <Panel
          type="filled"
          contentContainerStyle={styles.appLockingItemContainer}
          style={spacings.mb}
        >
          <Text fontSize={16} weight="regular" numberOfLines={1} style={flexboxStyles.flex1}>
            {t('Unlock with Biometrics')}
          </Text>
          <Toggle isOn={biometricsEnabled} label={t('Enabled')} onToggle={handleDisable} />
        </Panel>
      )
    }

    if (!hasBiometricsHardware) {
      return (
        <TextWarning appearance="info">
          {t('Biometrics authentication is not available on your device.')}
        </TextWarning>
      )
    }

    if (deviceSecurityLevel !== DEVICE_SECURITY_LEVEL.BIOMETRIC) {
      return (
        <>
          <Text type="small" style={spacings.mbLg}>
            {t('You can opt-in to use your phone biometrics to unlock your Ambire Key Store.')}
          </Text>
          <TextWarning appearance="info">
            {t(
              'This device supports biometric authentication, but you have not enrolled it on this device. If you want to use it - enroll it first on your device.'
            )}
          </TextWarning>
        </>
      )
    }

    return (
      <>
        <Text type="small" style={spacings.mb}>
          {t(
            'You can opt-in to use your phone biometrics to unlock your Ambire Key Store. To enable it, enter your Ambire Key Store {{passwordLabel}}.',
            { passwordLabel }
          )}
        </Text>
        <Controller
          control={control}
          rules={{
            required: t('Please fill in a {{passwordLabel}}.', { passwordLabel }) as string,
            validate: isPinEntry ? { isValidPin } : { isValidPasswordRule }
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <InputPassword
              placeholder={
                isPinEntry
                  ? t('Enter {{PIN_LENGTH}}-digit PIN', { PIN_LENGTH })
                  : t('Ambire Key Store {{passwordLabel}}', { passwordLabel })
              }
              onBlur={onBlur}
              onChangeText={onChange}
              isValid={isPinEntry ? value?.length === PIN_LENGTH : isValidPasswordRule(value)}
              maxLength={isPinEntry ? PIN_LENGTH : undefined}
              keyboardType={isPinEntry ? 'number-pad' : 'default'}
              value={value}
              disabled={isSubmitting}
              error={!!errors.password && errors.password.message}
              containerStyle={spacings.mbTy}
            />
          )}
          name="password"
        />
        <Button
          disabled={isSubmitting}
          text={isSubmitting ? t('Validating...') : t('Enable')}
          onPress={handleSubmit(handleEnable)}
          style={spacings.mbLg}
        />
      </>
    )
  }

  return (
    <GradientBackgroundWrapper>
      <Wrapper style={spacings.mt}>
        {renderContent()}
        <ManageLockVaultWhenInactive />
      </Wrapper>
    </GradientBackgroundWrapper>
  )
}

export default ManageVaultLockScreen
