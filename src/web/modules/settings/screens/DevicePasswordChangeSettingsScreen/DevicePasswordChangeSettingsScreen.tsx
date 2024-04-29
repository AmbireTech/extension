import React, { useContext, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { View } from 'react-native'
import { useModalize } from 'react-native-modalize'

import { isValidPassword } from '@ambire-common/services/validations'
import BottomSheet from '@common/components/BottomSheet'
import Button from '@common/components/Button'
import Input from '@common/components/Input'
import InputPassword from '@common/components/InputPassword'
import Text from '@common/components/Text'
import { useTranslation } from '@common/config/localization'
import useNavigation from '@common/hooks/useNavigation'
import useToast from '@common/hooks/useToast'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING_XL } from '@common/styles/spacings'
import flexbox from '@common/styles/utils/flexbox'
import text from '@common/styles/utils/text'
import useBackgroundService from '@web/hooks/useBackgroundService'
import useKeystoreControllerState from '@web/hooks/useKeystoreControllerState'
import KeyStoreLogo from '@web/modules/keystore/components/KeyStoreLogo'
import { SettingsRoutesContext } from '@web/modules/settings/contexts/SettingsRoutesContext'

const DevicePasswordChangeSettingsScreen = () => {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { dispatch } = useBackgroundService()
  const { navigate } = useNavigation()
  const state = useKeystoreControllerState()
  const { ref: modalRef, open: openModal, close: closeModal } = useModalize()
  const { setCurrentSettingsPage } = useContext(SettingsRoutesContext)

  const {
    control,
    handleSubmit,
    watch,
    setError,
    getValues,
    trigger,
    reset,
    formState: { errors, isSubmitting, isValid }
  } = useForm({
    mode: 'all',
    defaultValues: {
      password: '',
      newPassword: '',
      confirmNewPassword: ''
    }
  })

  // If Keystore password is not set yet, it is not possible to change it.
  // Because of this, if the user tries to load Settings -> Change password route,
  // we will redirect it to the route, where he can set its password for first time.
  useEffect(() => {
    if (!state.hasPasswordSecret) navigate(WEB_ROUTES.devicePasswordSet)
  }, [state.hasPasswordSecret, navigate])

  useEffect(() => {
    setCurrentSettingsPage('device-password-change')
  }, [setCurrentSettingsPage])

  const newPassword = watch('newPassword', '')

  useEffect(() => {
    if (!getValues('confirmNewPassword')) return

    trigger('confirmNewPassword').catch(() => {
      addToast(t('Something went wrong, please try again later.'), { type: 'error' })
    })
  }, [newPassword, trigger, addToast, t, getValues])

  useEffect(() => {
    if (state.errorMessage) {
      setError('password', {
        message: state.errorMessage
      })
    }
  }, [state.errorMessage, setError])

  useEffect(() => {
    if (state.statuses.changeKeystorePassword === 'SUCCESS') {
      reset()
      openModal()
    }
  }, [openModal, reset, state.statuses.changeKeystorePassword])

  const handleChangeKeystorePassword = () => {
    handleSubmit(({ password, newPassword: newPasswordFieldValue }) => {
      dispatch({
        type: 'KEYSTORE_CONTROLLER_CHANGE_PASSWORD',
        params: { secret: password, newSecret: newPasswordFieldValue }
      })
    })()
  }

  const isChangeKeystorePasswordLoading = state.statuses.changeKeystorePassword === 'LOADING'

  return (
    <View style={{ ...flexbox.flex1, maxWidth: 440 }}>
      <Text weight="medium" fontSize={20} style={[spacings.mtTy, spacings.mb2Xl]}>
        {t('Device Password')}
      </Text>

      <View style={{ flex: 1 }}>
        <Controller
          control={control}
          rules={{ validate: isValidPassword }}
          render={({ field: { onChange, onBlur, value } }) => (
            <InputPassword
              onBlur={onBlur}
              placeholder={t('Enter current password')}
              onChangeText={onChange}
              isValid={isValidPassword(value)}
              value={value}
              error={
                errors.password &&
                (errors.password.message || t('Please fill in at least 8 characters for password.'))
              }
              containerStyle={[spacings.mbTy]}
              onSubmitEditing={handleChangeKeystorePassword}
            />
          )}
          name="password"
        />
        <Controller
          control={control}
          rules={{ validate: isValidPassword }}
          render={({ field: { onChange, onBlur, value } }) => (
            <InputPassword
              onBlur={onBlur}
              placeholder={t('Enter new password')}
              onChangeText={onChange}
              isValid={isValidPassword(value)}
              value={value}
              error={
                errors.newPassword &&
                (t('Please fill in at least 8 characters for password.') as string)
              }
              containerStyle={[spacings.mbTy]}
              onSubmitEditing={handleChangeKeystorePassword}
            />
          )}
          name="newPassword"
        />
        <Controller
          control={control}
          rules={{
            validate: (value) => newPassword === value
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              onBlur={onBlur}
              placeholder={t('Repeat new password')}
              onChangeText={onChange}
              value={value}
              isValid={!!value && !errors.newPassword && newPassword === value}
              validLabel={t('✅ The new passwords match, you are ready to continue')}
              secureTextEntry
              error={errors.confirmNewPassword && (t("The new passwords don't match.") as string)}
              autoCorrect={false}
              containerStyle={[spacings.mbXl]}
              onSubmitEditing={handleChangeKeystorePassword}
            />
          )}
          name="confirmNewPassword"
        />
        <Button
          style={{ alignSelf: 'flex-start', paddingHorizontal: SPACING_XL }}
          textStyle={{ fontSize: 14 }}
          hasBottomSpacing={false}
          disabled={isSubmitting || isChangeKeystorePasswordLoading || !isValid}
          text={
            isSubmitting || isChangeKeystorePasswordLoading
              ? t('Loading...')
              : t('Change Device Password')
          }
          onPress={handleChangeKeystorePassword}
        />
      </View>
      <BottomSheet
        id="device-password-success-modal"
        backgroundColor="primaryBackground"
        sheetRef={modalRef}
        autoWidth
      >
        <Text weight="medium" fontSize={20} style={[text.center, spacings.mbXl]}>
          {t('Device Password')}
        </Text>
        <KeyStoreLogo style={[flexbox.alignSelfCenter, spacings.mbXl]} />
        <Text fontSize={16} style={[spacings.mbLg, text.center]}>
          {t('Your Device Password was successfully changed!')}
        </Text>
        <Button
          text={t('Got it')}
          hasBottomSpacing={false}
          style={{ minWidth: 232 }}
          onPress={() => closeModal()}
        />
      </BottomSheet>
    </View>
  )
}

export default React.memo(DevicePasswordChangeSettingsScreen)
