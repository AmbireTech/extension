import React, { useCallback, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Keyboard, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'

import Button from '@common/components/Button'
import InputPassword from '@common/components/InputPassword'
import Text from '@common/components/Text'
import Wrapper, { WRAPPER_TYPES } from '@common/components/Wrapper'
import { isWeb } from '@common/config/env'
import { useTranslation } from '@common/config/localization'
import useDisableNavigatingBack from '@common/hooks/useDisableNavigatingBack'
import useNavigation from '@common/hooks/useNavigation'
import { isValidPassword } from '@common/services/validations/validate'
import spacings from '@common/styles/spacings'
import flexboxStyles from '@common/styles/utils/flexbox'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import KeyStoreLogo from '@web/modules/keystore/components/KeyStoreLogo'

const FOOTER_BUTTON_HIT_SLOP = { top: 10, bottom: 15 }

const KeyStoreUnlockScreen = () => {
  const { t } = useTranslation()
  const { navigate } = useNavigation()
  const { dispatch } = useBackgroundService()
  const keystoreState = useKeystoreControllerState()

  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting }
  } = useForm({
    reValidateMode: 'onChange',
    defaultValues: {
      password: ''
    }
  })

  useDisableNavigatingBack()

  useEffect(() => {
    if (keystoreState.isUnlocked) {
      navigate('/')
    }
  }, [navigate, keystoreState])

  const handleUnlock = useCallback(
    ({ password }: { password: string }) => {
      dispatch({
        type: 'KEYSTORE_CONTROLLER_UNLOCK_WITH_SECRET',
        params: { secretId: 'password', secret: password }
      })
    },
    [dispatch]
  )

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        !isWeb && Keyboard.dismiss()
      }}
    >
      <Wrapper
        contentContainerStyle={[spacings.pbLg]}
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
                onSubmitEditing={handleSubmit((data) => unlockVault(data, setError))}
                error={
                  errors.password &&
                  (errors.password.message ||
                    t('Please fill in at least 8 characters for passphrase.'))
                }
                containerStyle={spacings.mbTy}
              />
            )}
            name="password"
          />

          <View style={spacings.ptSm}>
            <Button
              disabled={
                isSubmitting || keystoreState.status === 'LOADING' || !watch('password', '')
              }
              text={
                isSubmitting || keystoreState.status === 'LOADING' ? t('Unlocking...') : t('Unlock')
              }
              onPress={handleSubmit((data) => handleUnlock(data))}
            />
          </View>
          <View style={[flexboxStyles.justifyCenter, flexboxStyles.directionRow, spacings.pvTy]}>
            <TouchableOpacity onPress={() => null} hitSlop={FOOTER_BUTTON_HIT_SLOP}>
              <Text weight="medium" fontSize={12}>
                {t('Forgot Key Store passphrase?')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Wrapper>
    </TouchableWithoutFeedback>
  )
}

export default React.memo(KeyStoreUnlockScreen)
