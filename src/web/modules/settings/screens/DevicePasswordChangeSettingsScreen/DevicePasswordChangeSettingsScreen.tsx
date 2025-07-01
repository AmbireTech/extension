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
import useExtraEntropy from '@common/hooks/useExtraEntropy'
import useNavigation from '@common/hooks/useNavigation'
import useTheme from '@common/hooks/useTheme'
import useToast from '@common/hooks/useToast'
import { WEB_ROUTES } from '@common/modules/router/constants/common'
import spacings, { SPACING_XL } from '@common/styles/spacings'
import { THEME_TYPES } from '@common/styles/themeConfig'
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
  const { themeType } = useTheme()
  const {
    control,
    handleSubmit,
    watch,
    setError,
    getValues,
    trigger,
    reset,
    formState: { errors, isValid }
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
    if (state.errorMessage) setError('password', { message: state.errorMessage })
  }, [state.errorMessage, setError])

  useEffect(() => {
    if (state.statuses.changeKeystorePassword === 'SUCCESS') {
      reset()
      openModal()
    }
  }, [openModal, reset, state.statuses.changeKeystorePassword])

  const { getExtraEntropy } = useExtraEntropy()

  const handleChangeKeystorePassword = handleSubmit(
    ({ password, newPassword: newPasswordFieldValue }) =>
      dispatch({
        type: 'KEYSTORE_CONTROLLER_CHANGE_PASSWORD',
        params: {
          secret: password,
          newSecret: newPasswordFieldValue,
          extraEntropy: getExtraEntropy()
        }
      })
  )

  return (
    <>
      <View style={{ maxWidth: 440 }}>
        <Text weight="medium" fontSize={20} style={[spacings.mtTy, spacings.mb2Xl]}>
          {t('Change extension password')}
        </Text>
        <Controller
          control={control}
          rules={{ validate: isValidPassword }}
          render={({ field: { onChange, onBlur, value } }) => (
            <InputPassword
              testID="enter-current-pass-field"
              onBlur={onBlur}
              placeholder={t('Enter current password')}
              onChangeText={(val: string) => {
                onChange(val)
                if (state.errorMessage) {
                  dispatch({ type: 'KEYSTORE_CONTROLLER_RESET_ERROR_STATE' })
                }
              }}
              isValid={isValidPassword(value)}
              value={value}
              error={
                errors.password &&
                (errors.password.message || t('Please fill in at least 8 characters for password.'))
              }
              autoFocus
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
              testID="enter-new-pass-field"
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
              testID="repeat-new-pass-field"
              onBlur={onBlur}
              placeholder={t('Repeat new password')}
              onChangeText={onChange}
              value={value}
              isValid={!!value && !errors.newPassword && newPassword === value}
              validLabel={t('The new passwords match, you are ready to continue')}
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
          testID="change-device-pass-button"
          style={{ alignSelf: 'flex-start', paddingHorizontal: SPACING_XL }}
          hasBottomSpacing={false}
          // !== 'INITIAL' to prevent calling same func while the prev execution of that func sends it's status to the FE
          disabled={state.statuses.changeKeystorePassword !== 'INITIAL' || !isValid}
          text={
            state.statuses.changeKeystorePassword === 'LOADING'
              ? t('Loading...')
              : t('Change extension password')
          }
          onPress={handleChangeKeystorePassword}
        />
      </View>
      <BottomSheet
        id="device-password-success-modal"
        backgroundColor={
          themeType === THEME_TYPES.DARK ? 'secondaryBackground' : 'primaryBackground'
        }
        sheetRef={modalRef}
        autoWidth
      >
        <Text weight="medium" fontSize={20} style={[text.center, spacings.mbXl]}>
          {t('Extension password')}
        </Text>
        <KeyStoreLogo style={[flexbox.alignSelfCenter, spacings.mbXl]} />
        <Text fontSize={16} style={[spacings.mbLg, text.center]}>
          {t('Your extension password was successfully changed!')}
        </Text>
        <Button
          testID="device-pass-success-modal"
          text={t('Got it')}
          hasBottomSpacing={false}
          style={{ minWidth: 232 }}
          onPress={() => closeModal()}
        />
      </BottomSheet>
    </>
  )
}

export default React.memo(DevicePasswordChangeSettingsScreen)
