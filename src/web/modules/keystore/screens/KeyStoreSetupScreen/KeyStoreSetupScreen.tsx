import React, { useCallback, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'

import KeyStoreIcon from '@common/assets/svg/KeyStoreIcon'
import Button from '@common/components/Button'
import Checkbox from '@common/components/Checkbox'
import Input from '@common/components/Input'
import InputPassword from '@common/components/InputPassword'
import Text from '@common/components/Text'
import Toggle from '@common/components/Toggle'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import { DEVICE_SECURITY_LEVEL } from '@common/contexts/biometricsContext/constants'
import useBiometrics from '@common/hooks/useBiometrics'
import useNavigation from '@common/hooks/useNavigation'
import useRoute from '@common/hooks/useRoute'
import useStepper from '@common/modules/auth/hooks/useStepper'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import { isValidPassword } from '@common/services/validations/validate'
import colors from '@common/styles/colors'
import spacings, { SPACING_LG, SPACING_SM } from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import {
  AuthLayoutWrapperMainContent,
  AuthLayoutWrapperSideContent
} from '@web/components/AuthLayoutWrapper/AuthLayoutWrapper'
import styles from '@web/components/AuthLayoutWrapper/styles'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'

const KeyStoreSetupScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { params } = useRoute()
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false)
  const [enableEmailRecovery, onEnableEmailRecoveryChange] = useState(false)
  const { stepperState, updateStepperState } = useStepper()
  const state = useKeystoreControllerState()
  const { dispatch } = useBackgroundService()

  const setNextStepperState = useCallback(() => {
    updateStepperState(stepperState.currentStep + 1, stepperState.currentFlow)
  }, [stepperState.currentFlow, stepperState.currentStep, updateStepperState])

  const { hasBiometricsHardware, deviceSecurityLevel } = useBiometrics()
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    reValidateMode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
      optInForBiometricsUnlock:
        !isWeb && hasBiometricsHardware && deviceSecurityLevel === DEVICE_SECURITY_LEVEL.BIOMETRIC
    }
  })

  useEffect(() => {
    if (!params?.flow) {
      navigate(WEB_ROUTES.getStarted)
    }
  }, [params?.flow, navigate])

  useEffect(() => {
    if (state.latestMethodCall === 'addSecret' && state.status === 'DONE') {
      setIsSubmitSuccessful(true)

      setTimeout(() => {
        setNextStepperState()
        if (params?.flow === 'email') {
          navigate(WEB_ROUTES.createEmailVault, {
            state: { backTo: WEB_ROUTES.getStarted }
          })
          return
        }
        if (params?.flow === 'hw') {
          navigate(WEB_ROUTES.hardwareWalletSelect, { state: { backTo: WEB_ROUTES.getStarted } })
          return
        }
        if (params?.flow === 'legacy') {
          navigate(WEB_ROUTES.externalSigner, {
            state: { backTo: WEB_ROUTES.getStarted }
          })
        }
      }, 2800)
    }
  }, [state, navigate, setNextStepperState, dispatch, watch, params?.flow])

  const handleKeystoreSetup = () => {
    handleSubmit(({ password }) => {
      dispatch({
        type: 'KEYSTORE_CONTROLLER_ADD_SECRET',
        params: { secretId: 'password', secret: password, extraEntropy: '', leaveUnlocked: true }
      })
    })()
  }

  const isKeystoreSetupLoading =
    state.status !== 'INITIAL' && state.latestMethodCall === 'addSecret'

  return (
    <>
      <AuthLayoutWrapperMainContent hideStepper={isSubmitSuccessful}>
        <View
          style={[styles.mainContentWrapper, isSubmitSuccessful && flexboxStyles.justifyCenter]}
        >
          {!isSubmitSuccessful && (
            <Text weight="medium" fontSize={16} style={{ ...spacings.mbLg, textAlign: 'center' }}>
              {t('Ambire Key Store')}
            </Text>
          )}
          <KeyStoreIcon
            style={{ ...flexboxStyles.alignSelfCenter, marginBottom: SPACING_LG * 2 }}
          />
          {isSubmitSuccessful && (
            <Text
              color={colors.martinique}
              style={{ textAlign: 'center' }}
              weight="medium"
              fontSize={16}
            >
              {t('Your Ambire Key Store\nis ready!')}
            </Text>
          )}
          {!isSubmitSuccessful && (
            <>
              <Controller
                control={control}
                rules={{ validate: isValidPassword }}
                render={({ field: { onChange, onBlur, value } }) => (
                  <InputPassword
                    onBlur={onBlur}
                    placeholder={t('Enter Passphrase')}
                    onChangeText={onChange}
                    isValid={isValidPassword(value)}
                    autoFocus={isWeb}
                    value={value}
                    error={
                      errors.password &&
                      (t('Please fill in at least 8 characters for passphrase.') as string)
                    }
                    containerStyle={spacings.mbTy}
                    onSubmitEditing={handleKeystoreSetup}
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
                    placeholder={t('Repeat Passphrase')}
                    onChangeText={onChange}
                    value={value}
                    isValid={!!value && watch('password', '') === value}
                    secureTextEntry
                    error={errors.confirmPassword && (t("Passphrases don't match.") as string)}
                    autoCorrect={false}
                    containerStyle={spacings.mbSm}
                    onSubmitEditing={handleKeystoreSetup}
                  />
                )}
                name="confirmPassword"
              />
              {!!params.emailFlow && (
                <Checkbox
                  value={enableEmailRecovery}
                  onValueChange={() => onEnableEmailRecoveryChange((prev) => !prev)}
                  label={t('Key store recovery by email')}
                />
              )}
              {!isWeb &&
                hasBiometricsHardware &&
                deviceSecurityLevel === DEVICE_SECURITY_LEVEL.BIOMETRIC && (
                  <View style={[spacings.mbLg, flexboxStyles.alignEnd]}>
                    <Controller
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <Toggle isOn={value} label={t('Biometrics unlock?')} onToggle={onChange} />
                      )}
                      name="optInForBiometricsUnlock"
                    />
                  </View>
                )}

              <Button
                textStyle={{ fontSize: 14 }}
                disabled={
                  isSubmitting ||
                  isKeystoreSetupLoading ||
                  !watch('password', '') ||
                  !watch('confirmPassword', '')
                }
                text={
                  isSubmitting || isKeystoreSetupLoading
                    ? t('Setting Up Your Key Store...')
                    : t('Setup Ambire Key Store')
                }
                onPress={handleKeystoreSetup}
              />
            </>
          )}
        </View>
      </AuthLayoutWrapperMainContent>
      <AuthLayoutWrapperSideContent backgroundType="beta">
        <Text weight="medium" style={spacings.mb} color={colors.titan} fontSize={16}>
          {t('Setup Your Ambire Key Store')}
        </Text>
        <Text
          shouldScale={false}
          weight="regular"
          style={spacings.mb}
          color={colors.titan}
          fontSize={14}
        >
          {t(
            'Ambire Keystore will protect your Ambire Wallet with a passphrase, encrypting all the keys that are stored locally with this passphrase through secure AES encryption.'
          )}
        </Text>
        <ol style={{ fontSize: 14, color: colors.white, margin: 0, paddingLeft: SPACING_SM }}>
          <li style={spacings.mb}>
            <Text shouldScale={false} weight="regular" color={colors.titan} fontSize={14}>
              {t(
                'First, pick your passphrase. It should be long and you shouldnt reuse other passphrases.'
              )}
            </Text>
          </li>
          <li style={spacings.mb}>
            <Text shouldScale={false} weight="regular" color={colors.titan} fontSize={14}>
              {t(
                'You will use your passphrase to unlock the Ambire extension and sign transactions on this device.'
              )}
            </Text>
          </li>
          <li style={spacings.mb}>
            <Text
              shouldScale={false}
              weight="regular"
              style={spacings.mb}
              color={colors.titan}
              fontSize={14}
            >
              {t('This passphrase can only be reset if you enable recovery via your email vault.')}
            </Text>
          </li>
        </ol>
        <Text shouldScale={false} weight="regular" color={colors.radicalRed} fontSize={14}>
          {t(
            'If you disable email vault keystore recovery, and lose your passphrase, you will lose access to all keys and accounts on this device'
          )}
        </Text>
      </AuthLayoutWrapperSideContent>
    </>
  )
}

export default KeyStoreSetupScreen
